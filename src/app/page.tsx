'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { T, Lang, actionLabel } from '@/lib/i18n';
import { EGX30_TICKERS, SECTOR_COLORS } from '@/lib/tickers';
import type { RecommendationRow, NewsRow } from '@/lib/supabase';

type Filter = 'ALL' | 'BUY' | 'SELL' | 'HOLD';

function ActionBadge({ action, lang }: { action: string; lang: Lang }) {
  return (
    <span className={`action-${action} inline-block px-3 py-1 rounded-full text-sm font-bold`}>
      {actionLabel(action, lang)}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = ((score + 100) / 200) * 100;
  const color = score > 40 ? '#22c55e' : score < -10 ? '#ef4444' : '#eab308';
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all" />
    </div>
  );
}

function MarketStatus({ lang, t }: { lang: Lang; t: typeof T.en }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cairoTime, setCairoTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
      const cairoMin = (utcMin + 2 * 60) % 1440;
      const day = new Date(now.getTime() + 2 * 3600000).getUTCDay();
      setIsOpen(day <= 4 && cairoMin >= 600 && cairoMin <= 870);
      setCairoTime(now.toLocaleTimeString('en-EG', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isOpen ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
      <span className={`w-2 h-2 rounded-full ${isOpen ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
      {isOpen ? t.tradingHours : t.marketClosed} · {cairoTime} Cairo
    </div>
  );
}

function StockCard({ rec, lang, t }: { rec: RecommendationRow & { name_en: string; name_ar: string; sector: string }; lang: Lang; t: typeof T.en }) {
  const name = lang === 'ar' ? rec.name_ar : rec.name_en;
  const pct = rec.current_price > 0 && rec.stop_loss > 0
    ? (((rec.current_price - rec.stop_loss) / rec.current_price) * 100).toFixed(2)
    : '—';
  const tpPct = rec.current_price > 0 && rec.take_profit > 0
    ? (((rec.take_profit - rec.current_price) / rec.current_price) * 100).toFixed(2)
    : '—';
  const sectorColor = SECTOR_COLORS[rec.sector] ?? '#6b7280';
  const updatedAgo = rec.generated_at
    ? Math.floor((Date.now() - new Date(rec.generated_at).getTime()) / 60000)
    : null;

  return (
    <Link href={`/stock/${rec.symbol}`}>
      <div className={`card hover:border-slate-500 transition-all cursor-pointer h-full ${lang === 'ar' ? 'rtl' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-white font-bold">{rec.symbol.replace('.CA','')}</span>
              {rec.is_stale && <span className="text-xs text-amber-400 bg-amber-400/10 px-1 rounded">{t.stale}</span>}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{name}</p>
          </div>
          <ActionBadge action={rec.action} lang={lang} />
        </div>

        {/* Price */}
        <div className="mb-3">
          <p className="text-2xl font-bold text-white">
            EGP {rec.current_price?.toFixed(2) ?? '—'}
          </p>
          <p className="text-xs text-slate-400">
            {t.lastUpdated}: {updatedAgo !== null ? `${updatedAgo}m ago` : '—'}
          </p>
        </div>

        {/* Score bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{t.score}</span><span>{rec.score?.toFixed(1)}</span>
          </div>
          <ScoreBar score={rec.score ?? 0} />
        </div>

        {/* Key levels */}
        <div className="grid grid-cols-3 gap-2 text-center mb-3">
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="stat-label text-[10px]">{t.stopLoss}</p>
            <p className="text-xs font-semibold text-red-400">{rec.stop_loss?.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500">-{pct}%</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="stat-label text-[10px]">Entry</p>
            <p className="text-xs font-semibold text-slate-300">{rec.entry_low?.toFixed(2)}–{rec.entry_high?.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <p className="stat-label text-[10px]">{t.target}</p>
            <p className="text-xs font-semibold text-green-400">{rec.take_profit?.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500">+{tpPct}%</p>
          </div>
        </div>

        {/* Confidence + Sector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div style={{ width: `${rec.confidence ?? 0}%`, background: '#3b82f6' }} className="h-full rounded-full" />
            </div>
            <span className="text-xs text-slate-400">{rec.confidence?.toFixed(0)}%</span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${sectorColor}22`, color: sectorColor }}>{rec.sector}</span>
        </div>

        {/* Top reason */}
        {rec.reasons?.length > 0 && (
          <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 border-t border-slate-700 pt-2">
            {rec.reasons[0]?.replace(/🟢|🔴|⚠️|📰|🔔/g, '').trim()}
          </p>
        )}
      </div>
    </Link>
  );
}

function NewsCard({ item, lang }: { item: NewsRow; lang: Lang }) {
  const title = lang === 'ar' && item.title_ar ? item.title_ar : item.title_en;
  const sentColor = item.sentiment > 0.1 ? 'text-green-400' : item.sentiment < -0.1 ? 'text-red-400' : 'text-slate-400';
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer"
      className={`block p-3 rounded-lg bg-slate-800/40 border border-slate-700 hover:border-slate-500 transition-all ${lang === 'ar' ? 'rtl' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {item.is_material && <span className="inline-block text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded mb-1">🔔 Material</span>}
          <p className="text-sm text-slate-200 line-clamp-2">{title || item.url}</p>
          <p className="text-xs text-slate-500 mt-1">{item.source} · {item.published_at ? new Date(item.published_at).toLocaleDateString() : ''}</p>
          {item.tickers?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tickers.map(t => <span key={t} className="text-[10px] px-1 bg-blue-500/20 text-blue-400 rounded">{t.replace('.CA','')}</span>)}
            </div>
          )}
        </div>
        <span className={`text-xs font-medium ${sentColor} shrink-0`}>
          {item.sentiment > 0 ? '+' : ''}{(item.sentiment * 100).toFixed(0)}
        </span>
      </div>
    </a>
  );
}

export default function Dashboard() {
  const [lang, setLang] = useState<Lang>('en');
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');
  const [recs, setRecs] = useState<(RecommendationRow & { name_en: string; name_ar: string; sector: string })[]>([]);
  const [news, setNews] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const t = T[lang];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [recRes, newsRes] = await Promise.all([
        fetch('/api/recommendations'),
        fetch('/api/news'),
      ]);
      const recData = await recRes.json();
      const newsData = await newsRes.json();

      const recsRaw: RecommendationRow[] = recData.recommendations ?? [];
      const enriched = recsRaw.map(r => {
        const ticker = EGX30_TICKERS.find(t => t.symbol === r.symbol);
        return { ...r, name_en: ticker?.name_en ?? r.symbol, name_ar: ticker?.name_ar ?? r.symbol, sector: ticker?.sector ?? 'Unknown' };
      });
      setRecs(enriched.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)));
      setNews(newsData.news ?? []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); const id = setInterval(loadData, 5 * 60 * 1000); return () => clearInterval(id); }, [loadData]);

  const filtered = recs.filter(r => {
    const matchFilter = filter === 'ALL' || r.action === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || r.symbol.toLowerCase().includes(q) || r.name_en?.toLowerCase().includes(q) || r.name_ar?.includes(q);
    return matchFilter && matchSearch;
  });

  const topBuys  = recs.filter(r => r.action === 'BUY').slice(0, 5);
  const topSells = recs.filter(r => r.action === 'SELL').slice(0, 5);

  return (
    <div className={`min-h-screen ${lang === 'ar' ? 'rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-white">{t.title}</h1>
            <p className="text-xs text-slate-400 hidden sm:block">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <MarketStatus lang={lang} t={t} />
            <button onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-medium transition-all">
              {lang === 'en' ? 'عربي' : 'EN'}
            </button>
          </div>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="bg-amber-900/30 border-b border-amber-700/30">
        <p className="max-w-7xl mx-auto px-4 py-2 text-xs text-amber-300/80">{t.disclaimer}</p>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-lg">{t.loading}</div>
        ) : recs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg mb-2">{t.noData}</p>
            <p className="text-slate-500 text-sm">Hit <code className="bg-slate-800 px-1 rounded">/api/cron/prices</code> to run the first pipeline pass.</p>
          </div>
        ) : (
          <>
            {/* Top signals row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">🟢 {t.topBuys}</h2>
                <div className="space-y-2">
                  {topBuys.length === 0 && <p className="text-slate-500 text-sm">No BUY signals</p>}
                  {topBuys.map(r => (
                    <Link key={r.symbol} href={`/stock/${r.symbol}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20 hover:border-green-500/40 transition-all cursor-pointer">
                        <div>
                          <span className="font-mono text-white font-bold text-sm">{r.symbol.replace('.CA','')}</span>
                          <span className="text-slate-400 text-xs ml-2">{lang==='ar'?r.name_ar:r.name_en}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 font-semibold text-sm">EGP {r.current_price?.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">Score {r.score?.toFixed(1)} · {r.confidence?.toFixed(0)}% conf</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">🔴 {t.topSells}</h2>
                <div className="space-y-2">
                  {topSells.length === 0 && <p className="text-slate-500 text-sm">No SELL signals</p>}
                  {topSells.map(r => (
                    <Link key={r.symbol} href={`/stock/${r.symbol}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer">
                        <div>
                          <span className="font-mono text-white font-bold text-sm">{r.symbol.replace('.CA','')}</span>
                          <span className="text-slate-400 text-xs ml-2">{lang==='ar'?r.name_ar:r.name_en}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-red-400 font-semibold text-sm">EGP {r.current_price?.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">Score {r.score?.toFixed(1)} · {r.confidence?.toFixed(0)}% conf</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-wrap gap-3 items-center">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
              {(['ALL','BUY','HOLD','SELL'] as Filter[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter===f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                  {f==='ALL'?t.filterAll:f==='BUY'?t.filterBuy:f==='SELL'?t.filterSell:t.filterHold}
                  {f!=='ALL' && <span className="ml-1 text-xs opacity-70">({recs.filter(r=>r.action===f).length})</span>}
                </button>
              ))}
            </div>

            {/* Stock grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(r => <StockCard key={r.symbol} rec={r} lang={lang} t={t} />)}
            </div>

            {/* News feed */}
            {news.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">📰 {t.news}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {news.slice(0,12).map(n => <NewsCard key={n.id} item={n} lang={lang} />)}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-12 py-6 text-center text-xs text-slate-600">
        EGX Advisor · Data: Yahoo Finance · {new Date().getFullYear()} · {t.disclaimer}
      </footer>
    </div>
  );
}
