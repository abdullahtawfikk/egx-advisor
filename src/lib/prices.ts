import yahooFinance from 'yahoo-finance2';

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

export async function fetchQuote(symbol: string): Promise<QuoteResult | null> {
  try {
    const q = await yahooFinance.quote(symbol, {}, { validateResult: false });
    if (!q || !q.regularMarketPrice) return null;
    return {
      symbol,
      price: q.regularMarketPrice,
      open: q.regularMarketOpen ?? q.regularMarketPrice,
      high: q.regularMarketDayHigh ?? q.regularMarketPrice,
      low: q.regularMarketDayLow ?? q.regularMarketPrice,
      previousClose: q.regularMarketPreviousClose ?? q.regularMarketPrice,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? 0,
      marketCap: q.marketCap ?? 0,
      currency: q.currency ?? 'EGP',
      timestamp: q.regularMarketTime ? new Date(q.regularMarketTime) : new Date(),
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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const rows = await yahooFinance.historical(symbol, {
      period1: startDate, period2: endDate, interval: '1d'
    }, { validateResult: false });
    return rows.map(r => ({
      date: new Date(r.date),
      open: r.open ?? 0,
      high: r.high ?? 0,
      low: r.low ?? 0,
      close: r.close ?? 0,
      volume: r.volume ?? 0,
    }));
  } catch (err) {
    console.error(`fetchHistorical error for ${symbol}:`, err);
    return [];
  }
}

export async function fetchMultipleQuotes(symbols: string[]): Promise<Record<string, QuoteResult | null>> {
  const results: Record<string, QuoteResult | null> = {};
  // Batch in groups of 10 to be polite
  const batchSize = 10;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(s => fetchQuote(s).then(r => ({ s, r })));
    const settled = await Promise.allSettled(promises);
    for (const res of settled) {
      if (res.status === 'fulfilled') results[res.value.s] = res.value.r;
    }
  }
  return results;
}

/** Cairo trading session: Sun-Thu 10:00-14:30 EET (UTC+2) */
export function isTradingHours(): boolean {
  const now = new Date();
  const cairoOffset = 2 * 60; // UTC+2 minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const cairoMinutes = (utcMinutes + cairoOffset) % (24 * 60);
  const dayOfWeek = new Date(now.getTime() + cairoOffset * 60000).getUTCDay(); // 0=Sun
  const isTradingDay = dayOfWeek >= 0 && dayOfWeek <= 4; // Sun=0 to Thu=4
  const isOpen = cairoMinutes >= 10 * 60 && cairoMinutes <= 14 * 60 + 30;
  return isTradingDay && isOpen;
}

export function formatCairoTime(date: Date): string {
  return date.toLocaleString('en-EG', {
    timeZone: 'Africa/Cairo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }) + ' Cairo (EET)';
}
