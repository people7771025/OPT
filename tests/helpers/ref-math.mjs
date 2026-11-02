// 獨立參考實作（不依賴 index.html）：用來對照 Math2 的結果。
// normCDF 以 Simpson 數值積分計算，誤差 < 1e-12，與 A-S 近似式完全不同來源。

export function refNormPDF(x) {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

export function refNormCDF(x) {
  if (!Number.isFinite(x)) return x > 0 ? 1 : 0;
  if (x === 0) return 0.5;
  const a = Math.min(Math.abs(x), 40);
  const n = 20000; // 偶數
  const h = a / n;
  let s = refNormPDF(0) + refNormPDF(a);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * refNormPDF(i * h);
  const half = (s * h) / 3; // ∫0^a φ
  return x > 0 ? 0.5 + half : 0.5 - half;
}

export function refBS(S, K, T, r, sigma, isCall) {
  const sqrtT = Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * sqrtT);
  const d2 = d1 - sigma * sqrtT;
  const df = Math.exp(-r * T);
  return isCall
    ? S * refNormCDF(d1) - K * df * refNormCDF(d2)
    : K * df * refNormCDF(-d2) - S * refNormCDF(-d1);
}

/** 近似相等：|a-b| <= tol */
export function close(a, b, tol) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
}
