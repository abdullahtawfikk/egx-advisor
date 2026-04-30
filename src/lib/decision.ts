import type { TAResult } from './ta';
import type { QuoteResult } from './prices';

export type Action = 'BUY' | 'HOLD' | 'SELL';

export interface RiskGate { triggered: boolean; reason: string; }

export interface Decision {
  action: Action;
  score: number;          // -100 to +100
  taScore: number;
  newsScore: number;
  faScore: number;
  confidence: number;     // 0–100 %
  entryLow: number;
  entryHigh: number;
  stopLoss: number;
  takeProfit: number;
  timeWindow: string;
  reasons: string[];
  riskGates: RiskGate[];
  isStale: boolean;
}

/** Balanced persona thresholds */
const BUY_THRESHOLD  =  40;
const SELL_THRESHOLD = -8;  // calibrated for composite score range

export function makeDecision(
  ta: TAResult,
  quote: QuoteResult,
  newsScore = 0,   // -100 to +100, caller supplies
  faScore   = 0,   // -100 to +100
  newsReasons: string[] = [],
  isStale = false
): Decision {
  // Composite score: TA 50% + News 30% + FA 20%
  const score = ta.taScore * 0.5 + newsScore * 0.3 + faScore * 0.2;

  // Risk gates
  const riskGates: RiskGate[] = [];

  // Low liquidity gate (< 500 k EGP volume)
  const egpVolume = quote.volume * quote.price;
  // Only check when volume > 0; zero means market-closed data, not truly illiquid
  if (quote.volume > 0 && egpVolume < 500_000) {
    riskGates.push({ triggered: true, reason: `Low liquidity: ${(egpVolume/1000).toFixed(0)}k EGP daily volume < 500k threshold` });
  }

  // ATR chaos gate
  const atrPct = quote.price > 0 ? (ta.atr / quote.price) * 100 : 0;
  if (ta.volumeZscore > 3 && atrPct > 5) {
    riskGates.push({ triggered: true, reason: `High volatility: ATR=${atrPct.toFixed(1)}% of price, volume z=${ta.volumeZscore.toFixed(1)}σ` });
  }

  // Stale data gate
  if (isStale) {
    riskGates.push({ triggered: true, reason: 'Price data is stale (>5 min during trading hours)' });
  }

  const gateTriggered = riskGates.some(g => g.triggered);

  // Action with gates overriding to HOLD
  let action: Action;
  if (gateTriggered) {
    action = 'HOLD';
  } else if (score > BUY_THRESHOLD) {
    action = 'BUY';
  } else if (score < SELL_THRESHOLD) {
    action = 'SELL';
  } else {
    action = 'HOLD';
  }

  // Entry zone: ±0.5% around current price
  const price = quote.price;
  const entryLow  = +(price * 0.995).toFixed(4);
  const entryHigh = +(price * 1.005).toFixed(4);

  // Stop-loss: 1.5× ATR below entry (for BUY) or above (for SELL)
  const stopDistance = ta.atr * 1.5;
  const stopLoss   = action === 'BUY'  ? +(price - stopDistance).toFixed(4)
                   : action === 'SELL' ? +(price + stopDistance).toFixed(4)
                   : +(price - stopDistance).toFixed(4);

  // Take-profit: 2× risk distance (favourable direction)
  const tpDistance = stopDistance * 2;
  const takeProfit = action === 'BUY'  ? +(price + tpDistance).toFixed(4)
                   : action === 'SELL' ? +(price - tpDistance).toFixed(4)
                   : +(price + tpDistance).toFixed(4);

  // Confidence: based on absolute score magnitude and absence of gates
  const rawConf = Math.min(95, 40 + Math.abs(score) * 0.55);
  const confidence = gateTriggered ? Math.min(rawConf, 40) : rawConf;

  // Time window
  const timeWindow = Math.abs(score) > 60 ? 'Today open/close' : 'Next 1–3 sessions';

  // Reasons: TA signals + gates + news
  const reasons: string[] = [
    ...ta.signals.filter(s => s.direction !== 'neutral').map(s =>
      `${s.direction === 'bullish' ? '🟢' : '🔴'} ${s.name}: ${s.value}`
    ),
    ...newsReasons,
    ...riskGates.filter(g => g.triggered).map(g => `⚠️ Risk gate: ${g.reason}`),
  ];

  return {
    action, score: +score.toFixed(2), taScore: +ta.taScore.toFixed(2),
    newsScore: +newsScore.toFixed(2), faScore: +faScore.toFixed(2),
    confidence: +confidence.toFixed(1),
    entryLow, entryHigh, stopLoss, takeProfit,
    timeWindow, reasons, riskGates, isStale
  };
}
