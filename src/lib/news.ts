export interface NewsItem {
  url: string;
  title_en: string;
  title_ar: string;
  summary: string;
  published_at: string;
  source: string;
  tickers: string[];
  sentiment: number;
  is_material: boolean;
  event_type: string;
}

const FEEDS = [
  { url: 'https://enterprise.press/feed/', source: 'Enterprise', lang: 'en' },
  { url: 'https://www.dailynewsegypt.com/feed/', source: 'Daily News Egypt', lang: 'en' },
  { url: 'https://mubasher.info/rss', source: 'Mubasher', lang: 'ar' },
];

// Keywords → ticker mapping for news tagging
const TICKER_KEYWORDS: Record<string, string[]> = {
  'COMI.CA': ['CIB', 'commercial international bank', 'البنك التجاري الدولي'],
  'HRHO.CA': ['EFG hermes', 'hermes', 'هيرميس'],
  'EAST.CA': ['eastern company', 'الشرقية للدخان', 'eastern tobacco'],
  'TMGH.CA': ['talaat mostafa', 'طلعت مصطفى', 'TMG'],
  'ETEL.CA': ['telecom egypt', 'المصرية للاتصالات', 'we telecom'],
  'SWDY.CA': ['sewedy', 'السويدي'],
  'ABUK.CA': ['abu qir', 'أبو قير'],
  'FWRY.CA': ['fawry', 'فوري'],
  'EFIN.CA': ['e-finance', 'efinance', 'إي فاينانس'],
  'ISPH.CA': ['ibnsina', 'ibn sina', 'ابن سينا'],
  'IDHC.CA': ['IDH', 'integrated diagnostics'],
  'PHDC.CA': ['palm hills', 'بالم هيلز'],
  'TMGH.CA': ['talaat', 'TMG holding'],
  'OCDI.CA': ['orascom construction', 'أوراسكوم للإنشاء'],
  'ORAS.CA': ['orascom development', 'ODE'],
  'RAYA.CA': ['raya holding', 'راية'],
  'AUTO.CA': ['GB auto', 'جي بي'],
  'MFPC.CA': ['MOPCO', 'موبكو'],
  'JUFO.CA': ['juhayna', 'جهينة'],
};

const MATERIAL_KEYWORDS = ['earnings', 'dividend', 'capital increase', 'merger', 'acquisition',
  'EGX disclosure', 'mandatory disclosure', 'profit', 'results', 'quarterly',
  'أرباح', 'توزيعات', 'زيادة رأس المال', 'اندماج', 'استحواذ', 'نتائج'];

const BULLISH_WORDS = ['surge', 'rally', 'profit', 'record', 'growth', 'buy', 'upgrade', 'beat',
  'ارتفاع', 'نمو', 'أرباح', 'ربح', 'صعود'];
const BEARISH_WORDS = ['decline', 'fall', 'loss', 'sell', 'downgrade', 'miss', 'warn', 'drop',
  'هبوط', 'انخفاض', 'خسارة', 'تراجع'];

function tagTickers(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(TICKER_KEYWORDS)
    .filter(([, keywords]) => keywords.some(k => lower.includes(k.toLowerCase())))
    .map(([symbol]) => symbol);
}

function scoreSentiment(text: string): number {
  const lower = text.toLowerCase();
  const bull = BULLISH_WORDS.filter(w => lower.includes(w)).length;
  const bear = BEARISH_WORDS.filter(w => lower.includes(w)).length;
  if (bull + bear === 0) return 0;
  return parseFloat(((bull - bear) / (bull + bear)).toFixed(2));
}

function checkMaterial(text: string): { is_material: boolean; event_type: string } {
  const lower = text.toLowerCase();
  if (['earnings', 'quarterly', 'أرباح', 'نتائج'].some(k => lower.includes(k)))
    return { is_material: true, event_type: 'earnings' };
  if (['dividend', 'توزيعات'].some(k => lower.includes(k)))
    return { is_material: true, event_type: 'dividend' };
  if (['capital increase', 'زيادة رأس المال'].some(k => lower.includes(k)))
    return { is_material: true, event_type: 'capital_change' };
  if (['merger', 'acquisition', 'اندماج', 'استحواذ'].some(k => lower.includes(k)))
    return { is_material: true, event_type: 'ma' };
  if (MATERIAL_KEYWORDS.some(k => lower.includes(k.toLowerCase())))
    return { is_material: true, event_type: 'regulatory' };
  return { is_material: false, event_type: '' };
}

export async function fetchNewsFromFeeds(): Promise<NewsItem[]> {
  const items: NewsItem[] = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'EGX-Advisor/1.0 (research tool)' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const xml = await res.text();

      // Parse RSS items (simple regex-based for edge compatibility)
      const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
      for (const m of itemMatches) {
        const block = m[1];
        const title  = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) ||
                        block.match(/<title>(.*?)<\/title>/))?.[1]?.trim() ?? '';
        const link   = (block.match(/<link>(.*?)<\/link>/))?.[1]?.trim() ?? '';
        const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/))?.[1]?.trim() ?? '';
        const desc   = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) ||
                        block.match(/<description>(.*?)<\/description>/))?.[1]
          ?.replace(/<[^>]+>/g, '')?.trim()?.slice(0, 300) ?? '';

        if (!title || !link) continue;

        const combined = title + ' ' + desc;
        const tickers  = tagTickers(combined);
        const sentiment = scoreSentiment(combined);
        const { is_material, event_type } = checkMaterial(combined);

        items.push({
          url: link,
          title_en: feed.lang === 'en' ? title : '',
          title_ar: feed.lang === 'ar' ? title : '',
          summary: desc,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source: feed.source,
          tickers,
          sentiment,
          is_material,
          event_type,
        });
      }
    } catch (e) {
      console.error(`Feed fetch error (${feed.source}):`, e);
    }
  }

  return items;
}

export function newsScoreForTicker(symbol: string, news: NewsItem[]): { score: number; reasons: string[] } {
  const relevant = news.filter(n => n.tickers.includes(symbol));
  if (relevant.length === 0) return { score: 0, reasons: [] };

  // Weight material events 3×, regular 1×
  let weightedSentiment = 0, totalWeight = 0;
  const reasons: string[] = [];

  for (const n of relevant) {
    const weight = n.is_material ? 3 : 1;
    weightedSentiment += n.sentiment * weight;
    totalWeight += weight;
    const title = n.title_en || n.title_ar;
    const badge = n.is_material ? '🔔' : '📰';
    reasons.push(`${badge} ${n.source}: "${title.slice(0, 80)}" — [source](${n.url})`);
  }

  const normalised = totalWeight > 0 ? weightedSentiment / totalWeight : 0;
  return { score: +(normalised * 100).toFixed(1), reasons };
}
