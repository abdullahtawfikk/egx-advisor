import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchHistorical, fetchQuote, isTradingHours, formatCairoTime } from '@/lib/prices';
import type { QuoteResult } from '@/lib/prices';
import { computeTA } from '@/lib/ta';
import { makeDecision } from '@/lib/decision';
import { fetchNewsFromFeeds, newsScoreForTicker } from '@/lib/news';
import { EGX30_TICKERS } from '@/lib/tickers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const trading = isTradingHours();
  const newsItems = await fetchNewsFromFeeds();

  if (newsItems.length > 0) {
    await supabase.from('news_items').upsert(
      newsItems.map(n => ({ ...n, fetched_at: new Date().toISOString() })),
      { onConflict: 'url', ignoreDuplicates: true }
    );
  }

  const results: string[] = [];
  for (const ticker of EGX30_TICKERS) {
    try {
      const [bars, quote] = await Promise.all([
        fetchHistorical(ticker.symbol, 180),
        fetchQuote(ticker.symbol),
      ]);

      // Need at least 30 bars for meaningful TA; use last bar as fallback quote
      if (bars.length < 20) { results.push(`${ticker.symbol}: skip (bars=${bars.length})`); continue; }

      // Synthesize quote from last bar if live quote unavailable
      const lastBar = bars[bars.length - 1];
      const effectiveQuote: QuoteResult = quote ?? {
        symbol: ticker.symbol,
        price: lastBar.close,
        open: lastBar.open,
        high: lastBar.high,
        low: lastBar.low,
        previousClose: bars.length > 1 ? bars[bars.length - 2].close : lastBar.close,
        change: 0,
        changePercent: 0,
        volume: lastBar.volume,
        marketCap: 0,
        currency: 'EGP',
        timestamp: lastBar.date,
        source: 'Yahoo Historical',
        sourceUrl: `https://finance.yahoo.com/quote/${ticker.symbol}`,
      };

      const ta = computeTA(bars);
      if (!ta) { results.push(`${ticker.symbol}: ta-fail`); continue; }

      const priceAgeMs = Date.now() - effectiveQuote.timestamp.getTime();
      const isStale = trading && priceAgeMs > 5 * 60 * 1000;

      await supabase.from('ohlcv').upsert({
        symbol: ticker.symbol,
        timestamp: effectiveQuote.timestamp.toISOString(),
        open: effectiveQuote.open, high: effectiveQuote.high, low: effectiveQuote.low,
        close: effectiveQuote.price, volume: effectiveQuote.volume, source: effectiveQuote.source
      }, { onConflict: 'symbol,timestamp', ignoreDuplicates: true });

      const { score: newsScore, reasons: newsReasons } = newsScoreForTicker(ticker.symbol, newsItems);
      const decision = makeDecision(ta, effectiveQuote, newsScore, 0, newsReasons, isStale);

      await supabase.from('recommendations').insert({
        symbol: ticker.symbol,
        generated_at: new Date().toISOString(),
        action: decision.action,
        time_window: decision.timeWindow,
        entry_low: decision.entryLow, entry_high: decision.entryHigh,
        stop_loss: decision.stopLoss, take_profit: decision.takeProfit,
        confidence: decision.confidence, score: decision.score,
        ta_score: decision.taScore, news_score: decision.newsScore, fa_score: decision.faScore,
        reasons: decision.reasons, current_price: effectiveQuote.price,
        price_source: effectiveQuote.source, price_timestamp: effectiveQuote.timestamp.toISOString(),
        is_stale: isStale,
        raw_ta: { rsi: ta.rsi, macd: ta.macd, macdHist: ta.macdHist, adx: ta.adx, volumeZscore: ta.volumeZscore }
      });

      results.push(`${ticker.symbol}: ${decision.action} (score=${decision.score}, bars=${bars.length})`);
    } catch (e) {
      results.push(`${ticker.symbol}: error — ${e}`);
    }
  }

  return NextResponse.json({ ok: true, ran: results.length, results, timestamp: formatCairoTime(new Date()) });
}
