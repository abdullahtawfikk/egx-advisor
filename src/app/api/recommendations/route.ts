import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchHistorical, fetchQuote, isTradingHours, formatCairoTime } from '@/lib/prices';
import { computeTA } from '@/lib/ta';
import { makeDecision } from '@/lib/decision';
import { fetchNewsFromFeeds, newsScoreForTicker } from '@/lib/news';
import { EGX30_TICKERS } from '@/lib/tickers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const symbol = url.searchParams.get('symbol');

  // If symbol given, compute live. Otherwise read from Supabase.
  if (symbol) {
    return computeLive(symbol);
  }

  const { data, error } = await supabase
    .from('recommendations')
    .select('*')
    .order('generated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Latest rec per symbol
  const latest: Record<string, unknown> = {};
  for (const row of (data ?? [])) {
    if (!latest[(row as any).symbol]) latest[(row as any).symbol] = row;
  }

  return NextResponse.json({ recommendations: Object.values(latest) });
}

async function computeLive(symbol: string) {
  const [bars, quote, newsItems] = await Promise.all([
    fetchHistorical(symbol, 120),
    fetchQuote(symbol),
    fetchNewsFromFeeds(),
  ]);

  if (!quote) return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });
  if (bars.length < 52) return NextResponse.json({ error: 'Insufficient history' }, { status: 400 });

  const ta = computeTA(bars);
  if (!ta) return NextResponse.json({ error: 'TA computation failed' }, { status: 500 });

  const trading = isTradingHours();
  const priceAgeMs = Date.now() - quote.timestamp.getTime();
  const isStale = trading && priceAgeMs > 5 * 60 * 1000;

  const { score: newsScore, reasons: newsReasons } = newsScoreForTicker(symbol, newsItems);
  const decision = makeDecision(ta, quote, newsScore, 0, newsReasons, isStale);

  const ticker = EGX30_TICKERS.find(t => t.symbol === symbol);

  return NextResponse.json({
    symbol,
    ticker,
    quote: { ...quote, timestamp: formatCairoTime(quote.timestamp) },
    ta,
    decision,
    isTradingHours: trading,
    computedAt: formatCairoTime(new Date()),
  });
}
