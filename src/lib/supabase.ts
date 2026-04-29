import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface OHLCVRow {
  symbol: string; timestamp: string;
  open: number; high: number; low: number; close: number; volume: number; source: string;
}

export interface RecommendationRow {
  id: number; symbol: string; generated_at: string; action: 'BUY'|'HOLD'|'SELL';
  time_window: string; entry_low: number; entry_high: number;
  stop_loss: number; take_profit: number; confidence: number;
  score: number; ta_score: number; news_score: number; fa_score: number;
  reasons: string[]; current_price: number; price_source: string;
  price_timestamp: string; is_stale: boolean; raw_ta: Record<string,number>;
}

export interface NewsRow {
  id: number; url: string; title_en: string; title_ar: string; summary: string;
  published_at: string; source: string; tickers: string[];
  sentiment: number; is_material: boolean; event_type: string;
}
