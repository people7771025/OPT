// 保護：VolSkewExplorer（Ch12）、IVTermStructure（Ch11）、GreeksLab（Ch10）的判讀與顯示。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, render, badTokens } from './helpers/load-script.mjs';

const { VolSkewExplorer: VS, IVTermStructure: TS, GreeksLab: GL, Math2 } = loadApp().api;

const skewOf = (putIv, callIv) => {
  const { text } = render(VS, { spot: 500, putIv, callIv });
  const m = text.match(/Skew =\s*([+-]?[\d.]+)pp\s*([^\n]+)/);
  return { pp: Number(m[1]), verdict: m[2].trim(), text };
};
const curve = html => [...html.match(/class="curve-expiry" d="([^"]+)"/)[1].matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g)].map(m => [Number(m[1]), Number(m[2])]);

describe('VolSkewExplorer：預設情境（Ch12 widget：spot 500、put 32%、call 29%）', () => {
  const r = skewOf(32, 29);
  test('Skew +3.0pp → 「bearish skew · 正常市場狀態」', () => {
    assert.equal(r.pp, 3);
    assert.ok(r.verdict.startsWith('bearish skew · 正常市場狀態'));
  });
  test('無 NaN / Infinity', () => assert.deepEqual(badTokens(r.text), []));
});

describe('VolSkewExplorer：判讀門檻（與 Ch12 內文「>+5 高度 bearish」一致）', () => {
  const cases = [
    [40, 30, 10, '高度 bearish skew'], [23, 17, 6, '高度 bearish skew'], [35, 30, 5, 'bearish skew · 正常'],
    [31, 30, 1, '對稱'], [30, 30, 0, '對稱'], [28, 30, -2, 'bullish skew'], [25, 30, -5, '高度 bullish skew'], [20, 30, -10, '高度 bullish skew'],
  ];
  for (const [p, c, pp, v] of cases) {
    test(`put ${p}% / call ${c}% → ${pp >= 0 ? '+' : ''}${pp}pp「${v}」`, () => {
      const r = skewOf(p, c);
      assert.equal(r.pp, pp);
      assert.ok(r.verdict.startsWith(v), r.verdict);
    });
  }
});

describe('VolSkewExplorer：曲線形狀', () => {
  test('曲線 31 點；在 −5% 與 +5% 處分別通過 put / call 標記點（分段連續）', () => {
    const { html } = render(VS, { spot: 500, putIv: 32, callIv: 29 });
    const pts = curve(html);
    assert.equal(pts.length, 31);
    const circles = [...html.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map(m => [Number(m[1]), Number(m[2])]);
    assert.ok(Math.abs(pts[10][0] - circles[0][0]) < 0.06 && Math.abs(pts[10][1] - circles[0][1]) < 0.06, 'put 點');
    assert.ok(Math.abs(pts[20][0] - circles[1][0]) < 0.06 && Math.abs(pts[20][1] - circles[1][1]) < 0.06, 'call 點');
  });
  test('bearish skew 時深度價外 put 端 IV 最高（SVG y 最小）', () => {
    const pts = curve(render(VS, { spot: 500, putIv: 40, callIv: 25 }).html);
    assert.equal(Math.min(...pts.map(p => p[1])), pts[0][1]);
  });
  test('滑桿上下限（10/100）組合無 NaN', () => {
    for (const p of [10, 100]) for (const c of [10, 100]) assert.deepEqual(badTokens(render(VS, { spot: 500, putIv: p, callIv: c }).html), []);
  });
});

describe('IVTermStructure：contango / backwardation 判斷', () => {
  const pts = ivs => [14, 30, 60, 90, 120].map((dte, i) => ({ dte, iv: ivs[i] }));
  test('預設（Ch11 widget：28/29/30/31/32）→ Contango 正常結構', () => {
    const { text } = render(TS, { points: pts([28, 29, 30, 31, 32]) });
    assert.ok(text.includes('Contango 正常結構'));
    assert.ok(!text.includes('Backwardation'));
  });
  test('近月高於遠月（財報前 45/35/30/29/28）→ Backwardation 倒掛', () => {
    assert.ok(render(TS, { points: pts([45, 35, 30, 29, 28]) }).text.includes('Backwardation 倒掛偵測'));
  });
  test('只有中段一處下凹（28/30/29/31/32）也判為倒掛', () => {
    assert.ok(render(TS, { points: pts([28, 30, 29, 31, 32]) }).text.includes('Backwardation'));
  });
  test('完全平坦（30×5）→ 不算倒掛', () => {
    assert.ok(render(TS, { points: pts([30, 30, 30, 30, 30]) }).text.includes('Contango'));
  });
  test('單一期限點、滑桿上下限（5/200）無 NaN', () => {
    assert.deepEqual(badTokens(render(TS, { points: [{ dte: 30, iv: 30 }] }).html), []);
    assert.deepEqual(badTokens(render(TS, { points: pts([5, 200, 5, 200, 5]) }).html), []);
  });
});

describe('GreeksLab：預設情境（Ch10 widget：145 / 160 / 35 DTE / IV 55% / r 4.5%）', () => {
  const st = { spot: 145, strike: 160, dte: 35, iv: 55, rate: 4.5, isCall: true };
  const { text } = render(GL, st);
  const g = Math2.bs(145, 160, 35 / 365, 0.045, 0.55, true);
  test('Delta 顯示 +0.320（「30 delta 起始」）、等效 32 股', () => {
    assert.ok(text.includes('+0.320'));
    assert.ok(/≈ 32 股/.test(text));
    assert.equal(Math.round(g.delta * 100), 32);
  });
  test('理論價與 Math2.bs 一致（$4.6x），vega ≈ 0.16 / 1pp（Ch10 內文）', () => {
    assert.ok(text.includes(`$${g.price.toFixed(2)} / 股`));
    assert.ok(Math.abs(g.vega - 0.16) < 0.005);
  });
  test('theta 為負，提示「減少」', () => {
    assert.ok(text.includes('期權價值 減少'));
  });
});

describe('GreeksLab：邊界', () => {
  test('spot / strike = 0：夾到 0.01，Greeks 顯示有限值或「—」，無 NaN', () => {
    for (const [spot, strike] of [[0, 160], [145, 0], [0, 0]]) {
      assert.deepEqual(badTokens(render(GL, { spot, strike, dte: 35, iv: 55, rate: 4.5, isCall: true }).html), [], `${spot}/${strike}`);
    }
  });
  test('DTE 0 與 IV 下限：T 夾到 0.001 年，不出現 NaN', () => {
    assert.deepEqual(badTokens(render(GL, { spot: 160, strike: 160, dte: 0, iv: 5, rate: 4.5, isCall: true }).html), []);
  });
  test('put：delta 為負、等效股數為負', () => {
    const t = render(GL, { spot: 145, strike: 160, dte: 35, iv: 55, rate: 4.5, isCall: false }).text;
    assert.ok(/Δ Delta 方向敏感度\s*-0\.\d{3}/.test(t), t.slice(0, 300));
    assert.ok(/≈ -\d+ 股/.test(t));
  });
  test('DTE < 10 顯示 gamma 警示；DTE ≥ 10 不顯示', () => {
    assert.ok(render(GL, { spot: 160, strike: 160, dte: 1, iv: 55, rate: 4.5, isCall: true }).text.includes('接近到期，gamma 高'));
    assert.ok(!render(GL, { spot: 160, strike: 160, dte: 35, iv: 55, rate: 4.5, isCall: true }).text.includes('接近到期'));
  });
});
