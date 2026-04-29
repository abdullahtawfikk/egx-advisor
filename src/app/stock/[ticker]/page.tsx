'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { T, Lang, actionLabel } from '@/lib/i18n';
import { EGX30_TICKERS } from '@/lib/tickers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

type Decision = {
  action: string; score: number; taScore: number; newsScore: number; faScore: number;
  confidence: number; entryLow: number; entryHigh: number; stopLoss: number;
  takeProfit: number; timeWindow: string; reasons: string[];
};
type TAResult = { rsi: number; macd: number; macdHist: number; bbUpper: number; bbLower: number; bbMiddle: number; sma20: number; sma50: number; atr: number; adx: number; volumeZscore: number; taScore: number; signals: { name: string; value: string; direction: string }[] };
type QuoteResult = { symbol: string; price: number; change: number; changePercent: number; volume: number; high: number; low: number; timestamp: string; source: string; sourceUrl: string };

function GaugeRSI({ rsi }: { rsi: number }) {
  const angle = -135 + (rsi / 100) * 270;
  const color = rsi < 30 ? '#22c55e' : rsi > 70 ? '#ef4444' : '#eab308';
  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M15 75 A 40 40 0 1 1 85 75" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round"/>
        <path d="M15 75 A 40 40 0 1 1 85 75" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(rsi / 100) * 188} 188`} />
        <text x="50" y="62" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{rsi.toFixed(1)}</text>
        <text x="50" y="76" textAnchor="middle" fill="#94a3b8" fontSize="9">RSI</text>
      </svg>
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px' }}>
        <line x1="50" y1="50" x2="50" y2="18" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </g>
    </div>
  );
}

export default function StockPage() {
  const params = useParams();
  const rawTicker = (params?.ticker as string) ?? '';
  const symbol = rawTicker.includes('.CA') ? rawTicker : `${rawTicker}.CA`;
  const [lang, setLang] = useState<Lang>('en');
  const [data, setData] = useState<{ quote: QuoteResult; ta: TAResult; decision: Decision; isTradingHours: boolean; computedAt: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const t = T[lang];
  const ticker = EGX30_TICKERS.find(t => t.symbol === symbol);

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError('');
      try {
        const res = await fetch(`/api/recommendations?symbol=${encodeURIComponent(symbol)}`);
        if (!res.ok) { const e = await res.json(); setError(e.error ?? 'Failed'); return; }
        setData(await res.json());
      } catch (e) { setError(String(e)); }
      setLoading(false);
    };
    if (symbol) load();
  }, [symbol]);

  const name = ticker ? (lang === 'ar' ? ticker.name_ar : ticker.name_en) : symbol;

  return (
    <div className={`min-h-screen ${lang === 'ar' ? 'rtl' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white text-sm">← {t.dashboard}</Link>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-white font-bold">{symbol.replace('.CA','')}</span>
            <span className="text-slate-400 text-sm">{name}</span>
          </div>
          <button onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')}
            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition-all">
            {lang === 'en' ? 'عربي' : 'EN'}
          </button>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="bg-amber-900/30 border-b border-amber-700/30">
        <p className="max-w-5xl mx-auto px-4 py-2 text-xs text-amber-300/80">{t.disclaimer}</p>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {loading && <div className="text-center py-20 text-slate-400">{t.loading}</div>}
        {error && <div className="text-center py-20 text-red-400">Error: {error}</div>}
        {!loading && !error && data && (() => {
          const { quote, ta, decision } = data;
          const changeColor = quote.changePercent >= 0 ? 'text-green-400' : 'text-red-400';
          const actionColor = decision.action === 'BUY' ? 'border-green-500 bg-green-500/10'
                            : decision.action === 'SELL' ? 'border-red-500 bg-red-500/10'
                            : 'border-yellow-500 bg-yellow-500/10';
          return (
            <>
              {/* Price hero */}
              <div className={`card border-2 ${actionColor}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-3xl font-bold text-white">EGP {quote.price?.toFixed(2)}</h2>
                      <span className={`text-lg font-semibold ${changeColor}`}>
                        {quote.changePercent >= 0 ? '+' : ''}{quote.changePercent?.toFixed(2)}%
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      H: {quote.high?.toFixed(2)} · L: {quote.low?.toFixed(2)} · Vol: {(quote.volume/1000).toFixed(0)}K
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      {t.source}: <a href={quote.sourceUrl} target="_blank" className="text-blue-400 hover:underline">{quote.source}</a> · {quote.timestamp}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className={`action-${decision.action} inline-block px-6 py-3 rounded-2xl text-2xl font-bold mb-1`}>
                      {actionLabel(decision.action, lang)}
                    </div>
                    <p className="text-xs text-slate-400">{t.confidence}: {decision.confidence?.toFixed(0)}%</p>
                    <p className="text-xs text-slate-400">{decision.timeWindow}</p>
                  </div>
                </div>
              </div>

              {/* Key levels */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: t.entry, value: `${decision.entryLow?.toFixed(2)} – ${decision.entryHigh?.toFixed(2)}`, color: 'text-blue-400' },
                  { label: t.stopLoss, value: `EGP ${decision.stopLoss?.toFixed(2)}`, color: 'text-red-400' },
                  { label: t.target, value: `EGP ${decision.takeProfit?.toFixed(2)}`, color: 'text-green-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="card text-center">
                    <p className="stat-label mb-1">{label}</p>
                    <p className={`font-bold text-lg ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Score breakdown */}
              <div className="card">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Score Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'TA (50%)', score: decision.taScore, color: '#3b82f6' },
                    { label: 'News (30%)', score: decision.newsScore, color: '#8b5cf6' },
                    { label: 'Fundamentals (20%)', score: decision.faScore, color: '#f59e0b' },
                    { label: 'Composite', score: decision.score, color: decision.score > 40 ? '#22c55e' : decision.score < -10 ? '#ef4444' : '#eab308' },
                  ].map(({ label, score, color }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{label}</span><span style={{ color }}>{score?.toFixed(1)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div style={{ width: `${((score + 100) / 200) * 100}%`, background: color }} className="h-full rounded-full transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* TA indicators */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Technical Indicators</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'RSI (14)', value: ta.rsi?.toFixed(1), color: ta.rsi < 30 ? '#22c55e' : ta.rsi > 70 ? '#ef4444' : '#e2e8f0' },
                      { label: 'MACD Hist', value: ta.macdHist?.toFixed(4), color: ta.macdHist > 0 ? '#22c55e' : '#ef4444' },
                      { label: 'SMA 20', value: ta.sma20?.toFixed(2), color: '#94a3b8' },
                      { label: 'SMA 50', value: ta.sma50?.toFixed(2), color: '#94a3b8' },
                      { label: 'BB Upper', value: ta.bbUpper?.toFixed(2), color: '#94a3b8' },
                      { label: 'BB Lower', value: ta.bbLower?.toFixed(2), color: '#94a3b8' },
                      { label: 'ATR (14)', value: ta.atr?.toFixed(4), color: '#94a3b8' },
                      { label: 'ADX', value: ta.adx?.toFixed(1), color: ta.adx > 25 ? '#3b82f6' : '#94a3b8' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-slate-900/60 rounded-lg p-2">
                        <p className="text-[10px] text-slate-500 uppercase">{label}</p>
                        <p className="text-sm font-semibold" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Signals ({t.why})</h3>
                  <div className="space-y-2">
                    {ta.signals?.map((sig, i) => (
                      <div key={i} className={`flex items-start gap-2 text-xs p-2 rounded ${
                        sig.direction === 'bullish' ? 'bg-green-500/10 text-green-300' :
                        sig.direction === 'bearish' ? 'bg-red-500/10 text-red-300' : 'text-slate-400'
                      }`}>
                        <span>{sig.direction === 'bullish' ? '🟢' : sig.direction === 'bearish' ? '🔴' : '⚪'}</span>
                        <div><span className="font-medium">{sig.name}</span>: {sig.value}</div>
                      </div>
                    ))}
                    {decision.reasons?.filter(r => r.includes('📰') || r.includes('🔔')).map((r, i) => (
                      <div key={`news-${i}`} className="flex items-start gap-2 text-xs p-2 rounded bg-purple-500/10 text-purple-300">
                        <span>📰</span><div>{r.replace(/📰|🔔/g,'').trim()}</div>
                      </div>
                    ))}
                    {decision.reasons?.filter(r => r.includes('⚠️')).map((r, i) => (
                      <div key={`gate-${i}`} className="flex items-start gap-2 text-xs p-2 rounded bg-amber-500/10 text-amber-300">
                        <span>⚠️</span><div>{r.replace('⚠️','').trim()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          );
        })()}
      </main>

      <footer className="border-t border-slate-800 mt-12 py-4 text-center text-xs text-slate-600">
        {t.disclaimer}
      </footer>
    </div>
  );
}
