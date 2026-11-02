// 保護：MarginSimulator（Ch21）與 StockHedgeCalc（Ch23/Ch25）的台指期計算。
// WIP 2026-06-17：MarginSimulator 空單觸發價位曾算反（應為 current + D），此處釘住方向。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, render, badTokens } from './helpers/load-script.mjs';

const { MarginSimulator: MS, StockHedgeCalc: HC } = loadApp().api;

function parseMargin(text) {
  const n = s => Number(String(s).replace(/,/g, ''));
  const pl = text.match(/浮動損益\s*(([+-]?)NT\$(-?[\d,]+))/);
  const mc = text.match(/距 Margin Call（補繳警告）\s*([\d.]+) 點\s*→\s*(跌到|漲到)\s*(-?\d+) 點/);
  const lq = text.match(/距 強制平倉（斷頭）\s*([\d.]+) 點\s*→\s*(跌到|漲到)\s*(-?\d+) 點/);
  return {
    plRaw: pl ? pl[1] : '',
    pl: pl ? n(pl[3]) * (pl[2] === '-' ? -1 : 1) : NaN,
    equity: n((text.match(/帳戶權益\s*NT\$([\d,-]+)/) || [])[1]),
    initial: n((text.match(/原始保證金\s*NT\$([\d,]+)/) || [])[1]),
    status: (text.match(/狀態\s*(✓ 正常|⚠ Margin Call|✗ 已斷頭)/) || [])[1],
    mcPts: mc && n(mc[1]), mcDir: mc && mc[2], mcPrice: mc && n(mc[3]),
    lqPts: lq && n(lq[1]), lqDir: lq && lq[2], lqPrice: lq && n(lq[3]),
  };
}
const ms = st => parseMargin(render(MS, st).text);

describe('MarginSimulator：契約規格常數（與 Ch20 保證金表一致）', () => {
  test('TX / MTX / TMF 每點價值 200 / 50 / 10', () => {
    assert.equal(MS.CONTRACTS.TX.perPoint, 200);
    assert.equal(MS.CONTRACTS.MTX.perPoint, 50);
    assert.equal(MS.CONTRACTS.TMF.perPoint, 10);
  });
  test('原始 ≥ 維持 ≥ 結算，且三契約保證金比例相同（MTX = TX/4、TMF = TX/20）', () => {
    for (const k of ['initial', 'maint', 'settle']) {
      assert.equal(MS.CONTRACTS.MTX[k] * 4, MS.CONTRACTS.TX[k]);
      assert.equal(MS.CONTRACTS.TMF[k] * 20, MS.CONTRACTS.TX[k]);
    }
    for (const c of Object.values(MS.CONTRACTS)) assert.ok(c.initial > c.maint && c.maint > c.settle);
  });
});

describe('MarginSimulator：預設情境快照（Ch21 widget：TX 多 1 口 @20000）', () => {
  const r = ms({ contract: 'TX', entry: 20000, current: 20000, qty: 1, side: 'long' });
  test('損益 0、權益 = 原始保證金 184,000、狀態正常', () => {
    assert.equal(r.pl, 0);
    assert.equal(r.equity, 184000);
    assert.equal(r.initial, 184000);
    assert.equal(r.status, '✓ 正常');
  });
  test('距 Margin Call 215 點 → 跌到 19785；距斷頭 245 點 → 跌到 19755（與 Ch21 內文一致）', () => {
    assert.deepEqual([r.mcPts, r.mcDir, r.mcPrice], [215, '跌到', 19785]);
    assert.deepEqual([r.lqPts, r.lqDir, r.lqPrice], [245, '跌到', 19755]);
  });
});

describe('MarginSimulator：手算答案', () => {
  test('空單方向：TX 空 1 口 @20000 → 漲到 20215 追繳、漲到 20245 斷頭（WIP 修過的方向錯誤）', () => {
    const r = ms({ contract: 'TX', entry: 20000, current: 20000, qty: 1, side: 'short' });
    assert.deepEqual([r.mcDir, r.mcPrice, r.lqDir, r.lqPrice], ['漲到', 20215, '漲到', 20245]);
  });
  test('MTX 多 2 口 @20000、現 19900：損益 −10,000、權益 82,000、追繳價仍為 19785', () => {
    const r = ms({ contract: 'MTX', entry: 20000, current: 19900, qty: 2, side: 'long' });
    assert.equal(r.pl, -10000);
    assert.equal(r.equity, 82000);
    assert.equal(r.mcPts, 115);
    assert.equal(r.mcPrice, 19785);
  });
  test('TMF 空 5 口 @20000、現 20100：損益 −5,000、權益 41,000、正常、追繳價 20215', () => {
    const r = ms({ contract: 'TMF', entry: 20000, current: 20100, qty: 5, side: 'short' });
    assert.equal(r.pl, -5000);
    assert.equal(r.equity, 41000);
    assert.equal(r.status, '✓ 正常');
    assert.equal(r.mcPrice, 20215);
  });
  test('空單獲利：TX 空 1 口 @20000、現 19500 → +100,000', () => {
    assert.equal(ms({ contract: 'TX', entry: 20000, current: 19500, qty: 1, side: 'short' }).pl, 100000);
  });
});

describe('MarginSimulator：狀態門檻與性質', () => {
  test('TX 多單：19786 正常 → 19780 Margin Call → 19750 已斷頭', () => {
    const st = c => ms({ contract: 'TX', entry: 20000, current: c, qty: 1, side: 'long' }).status;
    assert.equal(st(19786), '✓ 正常');
    assert.equal(st(19780), '⚠ Margin Call');
    assert.equal(st(19750), '✗ 已斷頭');
  });
  test('TX 空單：20214 正常 → 20220 Margin Call → 20250 已斷頭（方向與多單相反）', () => {
    const st = c => ms({ contract: 'TX', entry: 20000, current: c, qty: 1, side: 'short' }).status;
    assert.equal(st(20214), '✓ 正常');
    assert.equal(st(20220), '⚠ Margin Call');
    assert.equal(st(20250), '✗ 已斷頭');
  });
  test('權益仍高於維持保證金時：追繳價 = 進場價 ∓ (原始−維持)/每點價值，與口數、目前價無關', () => {
    for (const contract of ['TX', 'MTX', 'TMF'])
      for (const side of ['long', 'short'])
        for (const qty of [1, 3, 20])
          for (const delta of [0, 50, 150]) {
            const sgn = side === 'long' ? 1 : -1;
            const spec = MS.CONTRACTS[contract];
            const r = ms({ contract, entry: 20000, current: 20000 - sgn * delta, qty, side });
            const expected = 20000 - sgn * (spec.initial - spec.maint) / spec.perPoint;
            assert.equal(r.mcPrice, expected, `${contract} ${side} q=${qty} d=${delta}`);
          }
  });
  test('滑桿範圍上下限（15000/25000、1/20 口）三契約無 NaN', () => {
    for (const contract of ['TX', 'MTX', 'TMF']) for (const side of ['long', 'short'])
      for (const [entry, current] of [[15000, 25000], [25000, 15000]]) for (const qty of [1, 20]) {
        assert.deepEqual(badTokens(render(MS, { contract, entry, current, qty, side }).text), []);
      }
  });
  test('損益顯示不出現「NT$-0」（空單在進場價時 (current−entry)×−1 = −0）', () => {
    const r = ms({ contract: 'TX', entry: 20000, current: 20000, qty: 1, side: 'short' });
    assert.ok(!/NT\$-0\b/.test(r.plRaw), r.plRaw);
    assert.equal(r.plRaw, '+NT$0');
  });
});

describe('MarginSimulator：已知疑似 bug（todo）', () => {
  test.todo('已跌破維持保證金時，追繳觸發價應仍顯示 19785（已觸發），目前因 Math.abs 顯示成更低的 19615', () => {
    const r = ms({ contract: 'TX', entry: 20000, current: 19700, qty: 1, side: 'long' });
    assert.equal(r.mcPrice, 19785);
  });
});

function parseHedge(text) {
  return {
    exact: Number((text.match(/理論口數（連續可分）\s*([\d.]+)/) || [])[1]),
    rounded: Number((text.match(/實際應賣口數\s*(\d+) 口/) || [])[1]),
    perContract: Number(((text.match(/每口避險規模\s*NT\$([\d,]+)/) || [])[1] || '').replace(/,/g, '')),
    residualLabel: (text.match(/(殘餘多頭暴險|過度避險（變空頭）|完全對沖)/) || [])[1],
    residualPct: Number((text.match(/(?:殘餘多頭暴險|過度避險（變空頭）|完全對沖)\s*([+-]?[\d.]+)%/) || [])[1]),
  };
}
const hc = st => parseHedge(render(HC, st).text);

describe('StockHedgeCalc：預設情境（Ch23 widget：300 萬、β1.1、指數 20000、MTX）', () => {
  const r = hc({ totalValue: 3000000, beta: 1.1, indexLevel: 20000, contract: 'MTX' });
  test('理論 3.30 口 → 取 3 口；每口 NT$1,000,000；殘餘多頭 +10.0%', () => {
    assert.equal(r.exact, 3.3);
    assert.equal(r.rounded, 3);
    assert.equal(r.perContract, 1000000);
    assert.equal(r.residualLabel, '殘餘多頭暴險');
    assert.equal(r.residualPct, 10);
  });
});

describe('StockHedgeCalc：手算答案與邊界', () => {
  test('同組合改 TX：0.825 口 → 1 口，過度避險 −23.3%', () => {
    const r = hc({ totalValue: 3000000, beta: 1.1, indexLevel: 20000, contract: 'TX' });
    assert.equal(r.exact, 0.83); // toFixed(2) of 0.825 (二進位表示略小於 .825)
    assert.equal(r.rounded, 1);
    assert.equal(r.residualLabel, '過度避險（變空頭）');
    assert.equal(r.residualPct, -23.3);
  });
  test('同組合改 TMF：16.5 口 → 17 口（Math.round 五入），−3.3%', () => {
    const r = hc({ totalValue: 3000000, beta: 1.1, indexLevel: 20000, contract: 'TMF' });
    assert.equal(r.exact, 16.5);
    assert.equal(r.rounded, 17);
    assert.equal(r.residualPct, -3.3);
  });
  test('Ch25 測驗：200 萬 × β1.1 ÷ (20000×50) = 2.2 口 → 2 口 MTX', () => {
    const r = hc({ totalValue: 2000000, beta: 1.1, indexLevel: 20000, contract: 'MTX' });
    assert.equal(r.exact, 2.2);
    assert.equal(r.rounded, 2);
  });
  test('口數 < 0.5 取整為 0：殘餘暴險 = β × 100%，不輸出 NaN', () => {
    const { text } = render(HC, { totalValue: 200000, beta: 0.3, indexLevel: 25000, contract: 'TX' });
    const r = parseHedge(text);
    assert.equal(r.rounded, 0);
    assert.equal(r.residualPct, 30);
    assert.deepEqual(badTokens(text), []);
  });
  test('剛好整除：完全對沖 0.0%', () => {
    const r = hc({ totalValue: 2000000, beta: 1, indexLevel: 20000, contract: 'MTX' });
    assert.equal(r.residualLabel, '完全對沖');
    assert.equal(r.residualPct, 0);
  });
  test('口數與 β 成正比、與指數成反比', () => {
    const a = hc({ totalValue: 5000000, beta: 1, indexLevel: 20000, contract: 'MTX' }).exact;
    const b = hc({ totalValue: 5000000, beta: 2, indexLevel: 20000, contract: 'MTX' }).exact;
    const c = hc({ totalValue: 5000000, beta: 1, indexLevel: 25000, contract: 'MTX' }).exact;
    assert.equal(b, a * 2);
    assert.ok(Math.abs(c - a * 0.8) < 0.01);
  });
});
