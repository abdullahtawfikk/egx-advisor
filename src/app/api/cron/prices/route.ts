import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchHistorical, fetchQuote, isTradingHours, formatCairoTime } from '@/lib/prices';
import { computeTA } from '@/lib/ta';
import { makeDecision } from '@/lib/decision';
import { fetchNewsFromFeeds, newsScoreForTicker } from '@/lib/news';
import { EGX30_TICKERS } from '@/lib/tickers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const trading = isTradingHours();
  const newsItems = await fetchNewsFromFeeds();

  // Save news
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
        fetchHistorical(ticker.symbol, 120),
        fetchQuote(ticker.symbol),
      ]);
      if (!quote || bars.length < 52) { results.push(`${ticker.symbol}: skip`); continue; }

      const ta = computeTA(bars);
      if (!ta) { results.push(`${ticker.symbol}: ta-fail`); continue; }

      const priceAgeMs = Date.now() - quote.timestamp.getTime();
      const isStale = trading && priceAgeMs > 5 * 60 * 1000;

      // Save OHLCV
      await supabase.from('ohlcv').upsert({
        symbol: ticker.symbol,
        timestamp: quote.timestamp.toISOString(),
        open: quote.open, high: quote.high, low: quote.low,
        close: quote.price, volume: quote.volume, source: 'yahoo'
      }, { onConflict: 'symbol,timestamp', ignoreDuplicates: true });

      const { score: newsScore, reasons: newsReasons } = newsScoreForTicker(ticker.symbol, newsItems);
      const decision = makeDecision(ta, quote, newsScore, 0, newsReasons, isStale);

      // Save recommendation
      await supabase.from('recommendations').insert({
        symbol: ticker.symbol,
        generated_at: new Date().toISOString(),
        action: decision.action,
        time_window: decision.timeWindow,
        entry_low: decision.entryLow, entry_high: decision.entryHigh,
        stop_loss: decision.stopLoss, take_profit: decision.takeProfit,
        confidence: decision.confidence, score: decision.score,
        ta_score: decision.taScore, news_score: decision.newsScore, fa_score: decision.faScore,
        reasons: decision.reasons, current_price: quote.price,
        price_source: quote.source, price_timestamp: quote.timestamp.toISOString(),
        is_stale: isStale,
        raw_ta: { rsi: ta.rsi, macd: ta.macd, macdHist: ta.macdHist, bb_pos: ((quote.price - ta.bbLower) / (ta.bbUpper - ta.bbLower || 1) * 100).toFixed(1), adx: ta.adx, volumeZscore: ta.volumeZscore }
      });

      results.push(`${ticker.symbol}: ${decision.action} (score=${decision.score})`);
    } catch (e) {
      results.push(`${ticker.symbol}: error – ${e}`);
    }
  }

  return NextResponse.json({ ok: true, ran: results.length, results, timestamp: formatCairoTime(new Date()) });
}
