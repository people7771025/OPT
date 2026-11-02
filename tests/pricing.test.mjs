// 保護：Math2.normCDF / normPDF / bs（Black-Scholes 價格與 Greeks）的數值正確性。
// GreeksLab、內文所有 BS 範例都依賴這三個函式；一旦被改壞，全站理論價與 Greeks 都會錯。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './helpers/load-script.mjs';
import { refNormCDF, refNormPDF, refBS, close } from './helpers/ref-math.mjs';

const { Math2 } = loadApp().api;
const bs = (...a) => Math2.bs(...a);

describe('normCDF：精度與對稱性', () => {
  test('N(0) = 0.5', () => {
    assert.ok(close(Math2.normCDF(0), 0.5, 1e-9));
  });

  const knownTable = [
    // 標準常態表（四位小數以上）
    [1, 0.841344746], [-1, 0.158655254], [1.96, 0.975002105], [-1.96, 0.024997895],
    [2.326, 0.989991], [0.5, 0.691462461], [3, 0.998650102], [-3, 0.001349898],
  ];
  for (const [x, p] of knownTable) {
    test(`N(${x}) ≈ ${p}（常態表）`, () => {
      assert.ok(close(Math2.normCDF(x), p, 2e-6), `got ${Math2.normCDF(x)}`);
    });
  }

  test('與獨立數值積分參考比對：x∈[-6,6] 步距 0.05 最大誤差 < 2e-7（A-S 7.1.26 理論上限 1.5e-7）', () => {
    let worst = 0;
    for (let x = -6; x <= 6.0001; x += 0.05) {
      worst = Math.max(worst, Math.abs(Math2.normCDF(x) - refNormCDF(x)));
    }
    assert.ok(worst < 2e-7, `worst=${worst}`);
  });

  test('對稱性 N(x) + N(-x) = 1（x∈[0,8]；x=0 時 -0 走正號分支，容許 A-S 近似誤差 1e-8）', () => {
    for (let x = 0; x <= 8; x += 0.25) {
      assert.ok(close(Math2.normCDF(x) + Math2.normCDF(-x), 1, x === 0 ? 1e-8 : 1e-12), `x=${x}`);
    }
  });

  test('單調不減且落在 [0,1]', () => {
    let prev = -1;
    for (let x = -10; x <= 10; x += 0.01) {
      const v = Math2.normCDF(x);
      assert.ok(v >= 0 && v <= 1, `x=${x} v=${v}`);
      assert.ok(v >= prev - 1e-15, `非單調 x=${x}`);
      prev = v;
    }
  });

  test('極端值：±Infinity 與 ±40 不產生 NaN', () => {
    assert.equal(Math2.normCDF(Infinity), 1);
    assert.equal(Math2.normCDF(-Infinity), 0);
    assert.ok(close(Math2.normCDF(40), 1, 1e-15));
    assert.ok(close(Math2.normCDF(-40), 0, 1e-15));
  });

  test('normPDF 與參考一致、峰值 1/√(2π)、對稱', () => {
    assert.ok(close(Math2.normPDF(0), 1 / Math.sqrt(2 * Math.PI), 1e-15));
    for (const x of [-3, -1.2, 0.3, 2.5]) {
      assert.ok(close(Math2.normPDF(x), refNormPDF(x), 1e-15));
      assert.ok(close(Math2.normPDF(x), Math2.normPDF(-x), 1e-15));
    }
  });
});

describe('Black-Scholes：教科書答案', () => {
  const cases = [
    // [說明, S, K, T, r, σ, call, put, tol]
    ['經典 ATM：S=100,K=100,T=1,r=5%,σ=20%', 100, 100, 1, 0.05, 0.20, 10.4506, 5.5735, 5e-4],
    ['Hull 例：S=42,K=40,T=0.5,r=10%,σ=20%', 42, 40, 0.5, 0.10, 0.20, 4.76, 0.81, 5e-3],
    ['Hull 例：S=49,K=50,T=20 週,r=5%,σ=20%', 49, 50, 0.3846, 0.05, 0.20, 2.40, null, 5e-3],
    ['Haug 例：S=60,K=65,T=0.25,r=8%,σ=30%', 60, 65, 0.25, 0.08, 0.30, 2.1334, null, 5e-4],
    ['r=0 ATM：call = put = S(2N(σ√T/2)−1)', 50, 50, 0.25, 0, 0.30, 2.9893, 2.9893, 5e-4],
  ];
  for (const [name, S, K, T, r, sig, c, p, tol] of cases) {
    test(name, () => {
      const call = bs(S, K, T, r, sig, true).price;
      assert.ok(close(call, c, tol), `call=${call} 預期≈${c}`);
      if (p != null) {
        const put = bs(S, K, T, r, sig, false).price;
        assert.ok(close(put, p, tol), `put=${put} 預期≈${p}`);
      }
    });
  }

  test('Hull 例 Greeks（S=49,K=50,T=0.3846,r=5%,σ=20%）：Δ≈0.522、Γ≈0.066、vega≈0.121/1pp、θ≈−4.31/年', () => {
    const g = bs(49, 50, 0.3846, 0.05, 0.20, true);
    assert.ok(close(g.delta, 0.522, 1e-3), `delta=${g.delta}`);
    assert.ok(close(g.gamma, 0.066, 1e-3), `gamma=${g.gamma}`);
    assert.ok(close(g.vega, 0.121, 1e-3), `vega=${g.vega}`);
    assert.ok(close(g.theta * 365, -4.31, 0.02), `theta/yr=${g.theta * 365}`);
  });

  test('與獨立參考實作在 200 組網格上差距 < 1e-5 × max(S,K)', () => {
    for (const S of [50, 95, 100, 105, 160])
      for (const K of [60, 100, 140])
        for (const T of [7 / 365, 0.25, 1, 3])
          for (const sig of [0.1, 0.55])
            for (const isCall of [true, false]) {
              const a = bs(S, K, T, 0.03, sig, isCall).price;
              const b = refBS(S, K, T, 0.03, sig, isCall);
              assert.ok(close(a, b, 1e-5 * Math.max(S, K)), `${S},${K},${T},${sig},${isCall}: ${a} vs ${b}`);
            }
  });
});

describe('Put-Call Parity：C − P = S − K·e^(−rT)', () => {
  const grid = [
    [100, 100, 1, 0.05, 0.2], [145, 160, 35 / 365, 0.045, 0.55], [20000, 19500, 0.1, 0.015, 0.18],
    [10, 30, 2, 0.02, 0.9], [300, 150, 0.5, -0.005, 0.35], [80, 80, 1 / 365, 0, 1.2],
  ];
  for (const [S, K, T, r, sig] of grid) {
    test(`S=${S},K=${K},T=${T.toFixed(4)},r=${r},σ=${sig}`, () => {
      const c = bs(S, K, T, r, sig, true).price;
      const p = bs(S, K, T, r, sig, false).price;
      assert.ok(close(c - p, S - K * Math.exp(-r * T), 1e-6 * Math.max(S, K)), `C−P=${c - p}`);
    });
  }
  test('Delta parity：Δcall − Δput = 1；Γ、vega 兩者相同', () => {
    for (const [S, K, T, r, sig] of grid) {
      const c = bs(S, K, T, r, sig, true), p = bs(S, K, T, r, sig, false);
      assert.ok(close(c.delta - p.delta, 1, 1e-12));
      assert.ok(close(c.gamma, p.gamma, 1e-15));
      assert.ok(close(c.vega, p.vega, 1e-15));
    }
  });
});

describe('Greeks：範圍與有限差分一致性', () => {
  const base = { S: 145, K: 160, T: 35 / 365, r: 0.045, sig: 0.55 };
  const price = (o, isCall) => bs(o.S, o.K, o.T, o.r, o.sig, isCall).price;

  test('Δcall ∈ [0,1]、Δput ∈ [−1,0]、Γ ≥ 0、vega ≥ 0（多組網格）', () => {
    for (const S of [50, 100, 145, 200, 400])
      for (const T of [1 / 365, 0.1, 1])
        for (const sig of [0.05, 0.3, 1.5]) {
          const c = bs(S, 150, T, 0.04, sig, true), p = bs(S, 150, T, 0.04, sig, false);
          assert.ok(c.delta >= 0 && c.delta <= 1, `call delta ${c.delta}`);
          assert.ok(p.delta >= -1 && p.delta <= 0, `put delta ${p.delta}`);
          assert.ok(c.gamma >= 0 && c.vega >= 0);
        }
  });

  for (const isCall of [true, false]) {
    const label = isCall ? 'call' : 'put';
    test(`${label} delta ≈ ∂P/∂S（中央差分）`, () => {
      const g = bs(base.S, base.K, base.T, base.r, base.sig, isCall);
      const h = 0.01;
      const fd = (price({ ...base, S: base.S + h }, isCall) - price({ ...base, S: base.S - h }, isCall)) / (2 * h);
      assert.ok(close(g.delta, fd, 1e-5), `${g.delta} vs ${fd}`);
    });
    test(`${label} gamma ≈ ∂²P/∂S²`, () => {
      const g = bs(base.S, base.K, base.T, base.r, base.sig, isCall);
      const h = 0.05;
      const fd = (price({ ...base, S: base.S + h }, isCall) - 2 * price(base, isCall) + price({ ...base, S: base.S - h }, isCall)) / (h * h);
      assert.ok(close(g.gamma, fd, 1e-5), `${g.gamma} vs ${fd}`);
    });
    test(`${label} vega（每 1pp IV）≈ P(σ+0.5pp) − P(σ−0.5pp)`, () => {
      const g = bs(base.S, base.K, base.T, base.r, base.sig, isCall);
      const fd = price({ ...base, sig: base.sig + 0.005 }, isCall) - price({ ...base, sig: base.sig - 0.005 }, isCall);
      assert.ok(close(g.vega, fd, 1e-4), `${g.vega} vs ${fd}`);
    });
    test(`${label} theta（每日曆日）≈ P(T−1/365·ε) 的差分`, () => {
      const g = bs(base.S, base.K, base.T, base.r, base.sig, isCall);
      const dT = 1e-5;
      const fd = (price({ ...base, T: base.T - dT }, isCall) - price({ ...base, T: base.T + dT }, isCall)) / (2 * dT) / 365;
      assert.ok(close(g.theta, fd, 1e-6), `${g.theta} vs ${fd}`);
    });
    test(`${label} rho（每 1pp 利率）≈ P(r+0.5pp) − P(r−0.5pp)`, () => {
      const g = bs(base.S, base.K, base.T, base.r, base.sig, isCall);
      const fd = price({ ...base, r: base.r + 0.005 }, isCall) - price({ ...base, r: base.r - 0.005 }, isCall);
      assert.ok(close(g.rho, fd, 1e-5), `${g.rho} vs ${fd}`);
    });
  }

  test('call theta 在正利率下為負（時間流逝對買方不利）', () => {
    for (const S of [100, 145, 200]) assert.ok(bs(S, 150, 0.2, 0.04, 0.4, true).theta < 0);
  });

  test('ATM gamma 隨到期逼近而放大（1 DTE > 30 DTE > 180 DTE）', () => {
    const g = d => bs(160, 160, d / 365, 0.045, 0.55, true).gamma;
    assert.ok(g(1) > g(30) && g(30) > g(180));
  });
});

describe('Black-Scholes：價格邊界（無套利）', () => {
  test('call ∈ [max(S−Ke^(−rT),0), S]；put ∈ [max(Ke^(−rT)−S,0), Ke^(−rT)]', () => {
    for (const S of [10, 90, 100, 110, 500])
      for (const T of [0.01, 0.5, 2])
        for (const sig of [0.01, 0.4, 2]) {
          const K = 100, r = 0.03, df = Math.exp(-r * T);
          const c = bs(S, K, T, r, sig, true).price, p = bs(S, K, T, r, sig, false).price;
          assert.ok(c >= Math.max(S - K * df, 0) - 1e-7 && c <= S + 1e-9, `call ${c}`);
          assert.ok(p >= Math.max(K * df - S, 0) - 1e-7 && p <= K * df + 1e-9, `put ${p}`);
        }
  });
  test('call 價格隨 S 遞增、隨 K 遞減；隨 σ 遞增', () => {
    const c = (S, K, sig) => bs(S, K, 0.5, 0.03, sig, true).price;
    assert.ok(c(101, 100, 0.3) > c(100, 100, 0.3));
    assert.ok(c(100, 101, 0.3) < c(100, 100, 0.3));
    assert.ok(c(100, 100, 0.31) > c(100, 100, 0.3));
  });
});

describe('極端輸入：不得出現 NaN / Infinity', () => {
  const finiteAll = g => Object.entries(g).every(([, v]) => Number.isFinite(v));
  const extremes = [
    ['σ→0（1e-9）ATM', 100, 100, 1, 0.05, 1e-9],
    ['σ→0（1e-6）深度價外', 100, 150, 0.5, 0.05, 1e-6],
    ['T→0（1e-10 年）ATM', 100, 100, 1e-10, 0.05, 0.3],
    ['T→0（1 秒）價內', 120, 100, 1 / (365 * 86400), 0.05, 0.3],
    ['深度價內 S=1000,K=1', 1000, 1, 1, 0.05, 0.3],
    ['深度價外 S=1,K=1000', 1, 1000, 1, 0.05, 0.3],
    ['負利率 r=−1%', 100, 100, 1, -0.01, 0.2],
    ['負利率 r=−5% 長天期', 100, 90, 10, -0.05, 0.2],
    ['超高波動 σ=500%', 100, 100, 1, 0.05, 5],
    ['超長天期 T=30 年', 100, 100, 30, 0.05, 0.3],
    ['台指點數量級 S=20000', 20000, 20500, 30 / 365, 0.015, 0.18],
  ];
  for (const [name, S, K, T, r, sig] of extremes) {
    test(name, () => {
      for (const isCall of [true, false]) {
        const g = bs(S, K, T, r, sig, isCall);
        assert.ok(finiteAll(g), `${isCall ? 'call' : 'put'}: ${JSON.stringify(g)}`);
        assert.ok(g.price >= -1e-9, `價格不得為負：${g.price}`);
      }
    });
  }

  test('σ→0：call 收斂到折現內在價值 max(S−Ke^(−rT),0)', () => {
    const c = bs(110, 100, 1, 0.05, 1e-9, true).price;
    assert.ok(close(c, 110 - 100 * Math.exp(-0.05), 1e-6), `c=${c}`);
    assert.ok(close(bs(90, 100, 1, 0.05, 1e-9, true).price, 0, 1e-9));
  });

  test('T ≤ 0 或 σ ≤ 0：回傳內在價值（fallback）且 Greeks 為 0', () => {
    assert.deepEqual({ ...bs(120, 100, 0, 0.05, 0.3, true) }, { price: 20, delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });
    assert.equal(bs(80, 100, -1, 0.05, 0.3, false).price, 20);
    assert.equal(bs(80, 100, 1, 0.05, 0, true).price, 0);
    assert.equal(bs(80, 100, 1, 0.05, -0.2, false).price, 20);
  });

  test('S 或 K 非正值：回傳全 NaN 物件（由 GreeksLab 顯示「—」）而不是丟例外', () => {
    for (const [S, K] of [[0, 100], [100, 0], [-5, 100], [NaN, 100]]) {
      const g = bs(S, K, 1, 0.05, 0.3, true);
      assert.ok(Object.values(g).every(Number.isNaN), JSON.stringify(g));
    }
  });

  test('冪等：同輸入重複呼叫結果完全相同（無隱藏狀態）', () => {
    const a = bs(145, 160, 35 / 365, 0.045, 0.55, true);
    const b = bs(145, 160, 35 / 365, 0.045, 0.55, true);
    assert.deepEqual({ ...a }, { ...b });
  });
});
