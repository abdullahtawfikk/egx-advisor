import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { fetchNewsFromFeeds } from '@/lib/news';
import { formatCairoTime } from '@/lib/prices';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET() {
  const items = await fetchNewsFromFeeds();
  if (items.length > 0) {
    await supabase.from('news_items').upsert(
      items.map(n => ({ ...n, fetched_at: new Date().toISOString() })),
      { onConflict: 'url', ignoreDuplicates: true }
    );
  }
  return NextResponse.json({ ok: true, saved: items.length, timestamp: formatCairoTime(new Date()) });
}
