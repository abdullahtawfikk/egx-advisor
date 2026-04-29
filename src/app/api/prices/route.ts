import { NextRequest, NextResponse } from 'next/server';
import { fetchMultipleQuotes } from '@/lib/prices';
import { EGX30_TICKERS } from '@/lib/tickers';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const symbolParam = url.searchParams.get('symbols');
  const symbols = symbolParam
    ? symbolParam.split(',').map(s => s.trim())
    : EGX30_TICKERS.map(t => t.symbol);

  const quotes = await fetchMultipleQuotes(symbols);
  return NextResponse.json({ quotes, fetchedAt: new Date().toISOString() });
}
