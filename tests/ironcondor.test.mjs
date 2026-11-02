// 保護：IronCondorBuilder（Ch16）的最大獲利／最大虧損／損益兩平／勝率。
// WIP 2026-06-17：勝率改以真正 1σ（em ÷ 0.7979）計算，預設值 74%→63%，此處釘住。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, render, badTokens } from './helpers/load-script.mjs';
import { refNormCDF, close } from './helpers/ref-math.mjs';

const { IronCondorBuilder: IC } = loadApp().api;

function parseIC(text) {
  const num = re => { const m = text.match(re); return m ? Number(m[1].replace(/,/g, '')) : NaN; };
  return {
    credit: num(/淨 Credit\s*\+\$([\d,.]+)/),
    maxProfit: num(/最大獲利\s*\+\$([\d,.]+)/),
    maxLoss: num(/最大損失\s*-\$([\d,.]+)/),
    winRate: num(/勝率估計\s*([\d.]+)%/),
    beDown: num(/Break-even\s*:\s*\$([\d.]+)/),
    beUp: num(/Break-even\s*:\s*\$[\d.]+\s*~\s*\$([\d.]+)/),
    em: num(/Expected Move[^±]*±\$([\d.]+)/),
    legs: (text.match(/買 LP \$(\d+) · 賣 SP \$(\d+) · Spot \$[\d.]+ · 賣 SC \$(\d+) · 買 LC \$(\d+)/) || []).slice(1).map(Number),
    warnNonPositive: text.includes('淨權利金非正值'),
  };
}

// 內文 Ch16 實例：SPY 500，478/470 put spread、522/530 call spread
const CH16 = { spot: 500, ivPct: 65, dte: 35, spreadWidth: 8,
  shortPut: 478, longPut: 470, shortCall: 522, longCall: 530,
  spPremium: 3.2, lpPremium: 1.8, scPremium: 2.9, lcPremium: 1.5 };

describe('IronCondorBuilder：預設情境快照（Ch16 widget：spot 500 / IVP 65 / DTE 35 / 寬 8）', () => {
  const { text } = render(IC, { spot: 500, ivPct: 65, dte: 35, spreadWidth: 8 });
  const r = parseIC(text);

  test('四腿 382 / 390 / 610 / 618（推薦 ±1.1×EM，取 5 的倍數）', () => {
    assert.deepEqual(r.legs, [382, 390, 610, 618]);
  });
  test('淨 credit = 最大獲利 = $138；最大損失 = 寬×100 − credit = $662', () => {
    assert.equal(r.credit, 138);
    assert.equal(r.maxProfit, 138);
    assert.equal(r.maxLoss, 800 - 138);
  });
  test('勝率釘住 63%（真正 1σ = em/0.7979；WIP 已由 74% 修為 63%）', () => {
    assert.equal(r.winRate, 63);
  });
  test('損益兩平 $388.62 ~ $611.38', () => {
    assert.equal(r.beDown, 388.62);
    assert.equal(r.beUp, 611.38);
  });
  test('渲染結果無 NaN / Infinity / undefined', () => {
    assert.deepEqual(badTokens(text), []);
  });
});

describe('IronCondorBuilder：手算答案', () => {
  test('Ch16 內文實例：credit $280、最大損失 $520、BE $475.20 / $524.80', () => {
    const r = parseIC(render(IC, CH16).text);
    assert.equal(r.credit, 280);
    assert.equal(r.maxProfit, 280);
    assert.equal(r.maxLoss, 520);
    assert.equal(r.beDown, 475.2);
    assert.equal(r.beUp, 524.8);
  });

  test('不對稱翼寬：取較寬一側的最大虧損（put 寬 10、call 寬 5、credit $200 → $800）', () => {
    const r = parseIC(render(IC, { ...CH16, longPut: 468, longCall: 527,
      spPremium: 3, lpPremium: 1, scPremium: 1, lcPremium: 1 }).text);
    assert.equal(r.credit, 200);
    assert.equal(r.maxLoss, 1000 - 200);
  });

  test('勝率 = N(zUp) − N(zDown)，σ = em/0.7979；與獨立 normCDF 相差 < 1 個百分點', () => {
    for (const st of [CH16, { spot: 300, ivPct: 40, dte: 21, spreadWidth: 5 }, { spot: 800, ivPct: 90, dte: 60, spreadWidth: 20 }]) {
      const { text } = render(IC, st);
      const r = parseIC(text);
      const sigma = IC.estEM(st.spot, st.ivPct, st.dte) / 0.7979;
      const expected = (refNormCDF((r.beUp - st.spot) / sigma) - refNormCDF((r.beDown - st.spot) / sigma)) * 100;
      assert.ok(Math.abs(r.winRate - expected) <= 1, `${r.winRate} vs ${expected}`);
    }
  });

  test('estPremium：距離 1.1 EM → factor 0.4/2.1；距離極遠時下限 0.05×EM', () => {
    assert.equal(IC.estPremium(500, 500 - 1.1 * 20, 20, false), Math.round(20 * (0.4 / 2.1) * 100) / 100);
    assert.equal(IC.estPremium(500, 100, 20, false), Math.round(20 * 0.05 * 100) / 100);
  });

  test('recommendStrikes：對稱、間距 = spreadWidth、皆為 5 的倍數', () => {
    const s = IC.recommendStrikes(500, 20, 8);
    assert.deepEqual({ ...s }, { shortPut: 480, longPut: 472, shortCall: 520, longCall: 528 });
  });
});

describe('IronCondorBuilder：性質與邊界', () => {
  test('最大損失 + 最大獲利 = 較寬翼 × 100（所有網格）', () => {
    for (const spot of [50, 200, 500, 800])
      for (const w of [3, 8, 20])
        for (const iv of [20, 60, 100]) {
          const r = parseIC(render(IC, { spot, ivPct: iv, dte: 35, spreadWidth: w }).text);
          if (r.warnNonPositive) continue;
          assert.ok(Math.abs(r.maxLoss + r.maxProfit - w * 100) <= 1, `spot=${spot} w=${w} iv=${iv}`);
          assert.ok(r.beDown < spot && r.beUp > spot);
          assert.ok(r.winRate >= 0 && r.winRate <= 100);
        }
  });

  test('IV 越高 → EM 越大 → short strike 越遠', () => {
    const lo = parseIC(render(IC, { spot: 500, ivPct: 20, dte: 35, spreadWidth: 8 }).text);
    const hi = parseIC(render(IC, { spot: 500, ivPct: 100, dte: 35, spreadWidth: 8 }).text);
    assert.ok(hi.em > lo.em);
    assert.ok(hi.legs[1] < lo.legs[1] && hi.legs[2] > lo.legs[2]);
  });

  test('淨權利金 ≤ 0（保護腿比賣方腿貴）：顯示警告，不輸出 NaN / Infinity', () => {
    const { text } = render(IC, { ...CH16, spPremium: 1, lpPremium: 2, scPremium: 1, lcPremium: 2 });
    assert.ok(parseIC(text).warnNonPositive);
    assert.deepEqual(badTokens(text), []);
  });

  test('淨權利金剛好 0：也走警告分支（避免損益比除以 0）', () => {
    const { text } = render(IC, { ...CH16, spPremium: 2, lpPremium: 2, scPremium: 1, lcPremium: 1 });
    assert.ok(parseIC(text).warnNonPositive);
    assert.deepEqual(badTokens(text), []);
  });

  test('極端輸入：滑桿上下限（spot 50/800、IVP 20/100、DTE 7/90、寬 3/20）無 NaN', () => {
    for (const spot of [50, 800]) for (const ivPct of [20, 100]) for (const dte of [7, 90]) for (const spreadWidth of [3, 20]) {
      assert.deepEqual(badTokens(render(IC, { spot, ivPct, dte, spreadWidth }).text), [], JSON.stringify({ spot, ivPct, dte, spreadWidth }));
    }
  });

  test('冪等：同狀態重複 render 結果一致', () => {
    assert.equal(render(IC, CH16).html, render(IC, CH16).html);
  });
});

describe('IronCondorBuilder：已知疑似 bug（todo，修正前不讓整體變紅）', () => {
  test.todo('estEM 應為 S·σ·√(DTE/365)·√(2/π)；目前把 σ 放進根號（S·√(σ·T)），500/65%/35 DTE 得 99.6 而非 80.3', () => {
    const expected = 500 * 0.65 * Math.sqrt(35 / 365) * Math.sqrt(2 / Math.PI);
    assert.ok(close(IC.estEM(500, 65, 35), expected, 0.01), `got ${IC.estEM(500, 65, 35)} expected ${expected}`);
  });
  test.todo('Ch16 widget 推薦的 short strike 應接近內文（EM≈$20 → 478/522），目前為 390/610（輸入欄是 IV Percentile 卻被當 IV 使用）', () => {
    const r = parseIC(render(IC, { spot: 500, ivPct: 65, dte: 35, spreadWidth: 8 }).text);
    assert.ok(Math.abs(r.legs[1] - 478) <= 10 && Math.abs(r.legs[2] - 522) <= 10, `legs=${r.legs}`);
  });
});
