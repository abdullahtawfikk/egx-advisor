import {
  RSI, MACD, BollingerBands, SMA, EMA, ATR, Stochastic, OBV, ADX
} from 'technicalindicators';
import type { HistoricalBar } from './prices';

export interface TAResult {
  rsi: number;
  macd: number; macdSignal: number; macdHist: number;
  bbUpper: number; bbMiddle: number; bbLower: number;
  sma20: number; sma50: number;
  ema12: number; ema26: number;
  atr: number;
  stochK: number; stochD: number;
  adx: number;
  obv: number;
  volumeZscore: number;
  taScore: number;    // -100 to +100
  signals: TASignal[];
}

export interface TASignal {
  name: string;
  value: string;
  direction: 'bullish' | 'bearish' | 'neutral';
  weight: number;   // contribution to score
}

function last<T>(arr: T[]): T { return arr[arr.length - 1]; }
function avg(arr: number[]): number { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function std(arr: number[]): number {
  const m = avg(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length);
}

export function computeTA(bars: HistoricalBar[]): TAResult | null {
  if (bars.length < 52) return null;

  const closes  = bars.map(b => b.close);
  const highs   = bars.map(b => b.high);
  const lows    = bars.map(b => b.low);
  const volumes = bars.map(b => b.volume);

  // RSI
  const rsiArr = RSI.calculate({ period: 14, values: closes });
  const rsi    = last(rsiArr) ?? 50;

  // MACD
  const macdArr = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9, SimpleMAOscillator: false, SimpleMASignal: false });
  const macdObj = last(macdArr) ?? { MACD: 0, signal: 0, histogram: 0 };
  const macd = macdObj.MACD ?? 0, macdSignal = macdObj.signal ?? 0, macdHist = macdObj.histogram ?? 0;

  // Bollinger Bands
  const bbArr = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });
  const bbObj = last(bbArr) ?? { upper: 0, middle: 0, lower: 0 };
  const { upper: bbUpper, middle: bbMiddle, lower: bbLower } = bbObj;

  // SMA
  const sma20 = last(SMA.calculate({ period: 20, values: closes })) ?? 0;
  const sma50 = last(SMA.calculate({ period: 50, values: closes })) ?? 0;

  // EMA
  const ema12 = last(EMA.calculate({ period: 12, values: closes })) ?? 0;
  const ema26 = last(EMA.calculate({ period: 26, values: closes })) ?? 0;

  // ATR
  const atrArr = ATR.calculate({ period: 14, high: highs, low: lows, close: closes });
  const atr    = last(atrArr) ?? 0;

  // Stochastic
  const stochArr = Stochastic.calculate({ high: highs, low: lows, close: closes, period: 14, signalPeriod: 3 });
  const stochObj = last(stochArr) ?? { k: 50, d: 50 };
  const stochK = stochObj.k ?? 50, stochD = stochObj.d ?? 50;

  // ADX (not all versions have ADX in technicalindicators — fall back gracefully)
  let adx = 25;
  try {
    const adxArr = ADX.calculate({ period: 14, high: highs, low: lows, close: closes });
    adx = (last(adxArr) as any)?.adx ?? 25;
  } catch { adx = 25; }

  // OBV
  const obvArr = OBV.calculate({ close: closes, volume: volumes });
  const obv    = last(obvArr) ?? 0;

  // Volume z-score (last 20 bars)
  const vol20   = volumes.slice(-20);
  const volMean = avg(vol20);
  const volStd  = std(vol20) || 1;
  const volumeZscore = (volumes[volumes.length - 1] - volMean) / volStd;

  const currentPrice = last(closes);

  // ─── Scoring signals ───
  const signals: TASignal[] = [];
  let score = 0;

  // RSI
  if (rsi < 30) { signals.push({ name: 'RSI', value: `${rsi.toFixed(1)} (Oversold)`, direction: 'bullish', weight: 20 }); score += 20; }
  else if (rsi < 45) { signals.push({ name: 'RSI', value: `${rsi.toFixed(1)} (Approaching OS)`, direction: 'bullish', weight: 8 }); score += 8; }
  else if (rsi > 70) { signals.push({ name: 'RSI', value: `${rsi.toFixed(1)} (Overbought)`, direction: 'bearish', weight: -20 }); score -= 20; }
  else if (rsi > 60) { signals.push({ name: 'RSI', value: `${rsi.toFixed(1)} (Near OB)`, direction: 'bearish', weight: -8 }); score -= 8; }
  else { signals.push({ name: 'RSI', value: `${rsi.toFixed(1)} (Neutral)`, direction: 'neutral', weight: 0 }); }

  // MACD
  if (macdHist > 0 && macdHist > (last(macdArr.slice(-2, -1))?.histogram ?? 0)) {
    signals.push({ name: 'MACD', value: 'Bullish cross / expanding histogram', direction: 'bullish', weight: 20 }); score += 20;
  } else if (macdHist > 0) {
    signals.push({ name: 'MACD', value: 'Above signal (positive)', direction: 'bullish', weight: 10 }); score += 10;
  } else if (macdHist < 0 && macdHist < (last(macdArr.slice(-2, -1))?.histogram ?? 0)) {
    signals.push({ name: 'MACD', value: 'Bearish cross / expanding negative hist', direction: 'bearish', weight: -20 }); score -= 20;
  } else {
    signals.push({ name: 'MACD', value: 'Below signal (negative)', direction: 'bearish', weight: -10 }); score -= 10;
  }

  // Price vs SMA20 / SMA50
  if (currentPrice > sma20 && sma20 > sma50) {
    signals.push({ name: 'Trend', value: `Price > SMA20 > SMA50 (uptrend)`, direction: 'bullish', weight: 15 }); score += 15;
  } else if (currentPrice < sma20 && sma20 < sma50) {
    signals.push({ name: 'Trend', value: `Price < SMA20 < SMA50 (downtrend)`, direction: 'bearish', weight: -15 }); score -= 15;
  } else if (currentPrice > sma50) {
    signals.push({ name: 'Trend', value: `Price above SMA50`, direction: 'bullish', weight: 5 }); score += 5;
  } else {
    signals.push({ name: 'Trend', value: `Price below SMA50`, direction: 'bearish', weight: -5 }); score -= 5;
  }

  // Bollinger Band position
  const bbRange = bbUpper - bbLower;
  const bbPos   = bbRange > 0 ? (currentPrice - bbLower) / bbRange : 0.5;
  if (bbPos < 0.15) {
    signals.push({ name: 'Bollinger', value: `Price near lower band (${(bbPos*100).toFixed(0)}%)`, direction: 'bullish', weight: 12 }); score += 12;
  } else if (bbPos > 0.85) {
    signals.push({ name: 'Bollinger', value: `Price near upper band (${(bbPos*100).toFixed(0)}%)`, direction: 'bearish', weight: -12 }); score -= 12;
  } else {
    signals.push({ name: 'Bollinger', value: `Price mid-band (${(bbPos*100).toFixed(0)}%)`, direction: 'neutral', weight: 0 });
  }

  // Stochastic
  if (stochK < 20 && stochK > stochD) {
    signals.push({ name: 'Stochastic', value: `K=${stochK.toFixed(1)},D=${stochD.toFixed(1)} (OS cross)`, direction: 'bullish', weight: 15 }); score += 15;
  } else if (stochK > 80 && stochK < stochD) {
    signals.push({ name: 'Stochastic', value: `K=${stochK.toFixed(1)},D=${stochD.toFixed(1)} (OB cross)`, direction: 'bearish', weight: -15 }); score -= 15;
  }

  // Volume spike
  if (volumeZscore > 2) {
    signals.push({ name: 'Volume', value: `Volume spike z=${volumeZscore.toFixed(1)}σ`, direction: 'bullish', weight: 10 }); score += 10;
  } else if (volumeZscore < -1) {
    signals.push({ name: 'Volume', value: `Low volume z=${volumeZscore.toFixed(1)}σ`, direction: 'bearish', weight: -5 }); score -= 5;
  }

  // ADX trend strength gate (if weak trend, dampen)
  if (adx < 20) score = score * 0.6;

  const taScore = Math.max(-100, Math.min(100, score));

  return { rsi, macd, macdSignal, macdHist, bbUpper, bbMiddle, bbLower, sma20, sma50, ema12, ema26, atr, stochK, stochD, adx, obv, volumeZscore, taScore, signals };
}
