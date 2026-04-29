export interface QuoteResult {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  currency: string;
  timestamp: Date;
  source: string;
  sourceUrl: string;
}

export interface HistoricalBar {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/json',
};

export async function fetchQuote(symbol: string): Promise<QuoteResult | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const price = meta.regularMarketPrice ?? meta.previousClose;
    if (!price) return null;

    return {
      symbol,
      price,
      open: meta.regularMarketOpen ?? price,
      high: meta.regularMarketDayHigh ?? price,
      low: meta.regularMarketDayLow ?? price,
      previousClose: meta.previousClose ?? price,
      change: meta.regularMarketChange ?? 0,
      changePercent: meta.regularMarketChangePercent ?? 0,
      volume: meta.regularMarketVolume ?? 0,
      marketCap: meta.marketCap ?? 0,
      currency: meta.currency ?? 'EGP',
      timestamp: new Date((meta.regularMarketTime ?? Date.now() / 1000) * 1000),
      source: 'Yahoo Finance',
      sourceUrl: `https://finance.yahoo.com/quote/${symbol}`,
    };
  } catch (err) {
    console.error(`fetchQuote error for ${symbol}:`, err);
    return null;
  }
}

export async function fetchHistorical(symbol: string, days = 120): Promise<HistoricalBar[]> {
  try {
    const range = days <= 60 ? '3mo' : days <= 120 ? '6mo' : '1y';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
    const res = await fetch(url, { headers: YF_HEADERS, signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.error(`fetchHistorical ${symbol}: HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const ohlcv = result.indicators?.quote?.[0] ?? {};
    const opens: number[] = ohlcv.open ?? [];
    const highs: number[] = ohlcv.high ?? [];
    const lows: number[] = ohlcv.low ?? [];
    const closes: number[] = ohlcv.close ?? [];
    const volumes: number[] = ohlcv.volume ?? [];

    const bars: HistoricalBar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] == null) continue;
      bars.push({
        date: new Date(timestamps[i] * 1000),
        open: opens[i] ?? closes[i],
        high: highs[i] ?? closes[i],
        low: lows[i] ?? closes[i],
        close: closes[i],
        volume: volumes[i] ?? 0,
      });
    }
    return bars;
  } catch (err) {
    console.error(`fetchHistorical error for ${symbol}:`, err);
    return [];
  }
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<Record<string, QuoteResult | null>> {
  const results: Record<string, QuoteResult | null> = {};
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(s => fetchQuote(s).then(r => ({ s, r }))));
    for (const res of settled) {
      if (res.status === 'fulfilled') results[res.value.s] = res.value.r;
    }
  }
  return results;
}

export function isTradingHours(): boolean {
  const now = new Date();
  const cairoOffset = 2 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const cairoMinutes = (utcMinutes + cairoOffset) % (24 * 60);
  const dayOfWeek = new Date(now.getTime() + cairoOffset * 60000).getUTCDay();
  return dayOfWeek >= 0 && dayOfWeek <= 4 && cairoMinutes >= 600 && cairoMinutes <= 870;
}

export function formatCairoTime(date: Date): string {
  return date.toLocaleString('en-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }) + ' Cairo (EET)';
}
