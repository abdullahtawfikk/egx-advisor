import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchNewsFromFeeds } from '@/lib/news';
import { formatCairoTime } from '@/lib/prices';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const items = await fetchNewsFromFeeds();
  if (items.length > 0) {
    await supabase.from('news_items').upsert(
      items.map(n => ({ ...n, fetched_at: new Date().toISOString() })),
      { onConflict: 'url', ignoreDuplicates: true }
    );
  }
  return NextResponse.json({ ok: true, saved: items.length, timestamp: formatCairoTime(new Date()) });
}
