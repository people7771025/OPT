// 保護：IVCrushAnimator（Ch18）。WIP 2026-06-17：舊模型預設顯示約 +2323% 假獲利，與本章
// 「方向對也會被 IV crush 吃掉」相反；重寫後預設（T-7、跳幅 7%）必須顯示虧損。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, render, badTokens, fakeWidget } from './helpers/load-script.mjs';

const { IVCrushAnimator: IVC } = loadApp().api;

function parse(text) {
  const v = text.match(/(✅|🟡|❌) 跳幅 ±([\d.]+)% [^（]*（±([\d.]+)%）([^\n]*)/);
  if (!v) return null;
  const pls = [...v[4].matchAll(/([+-]?\d+)%/g)];
  return { icon: v[1], move: Number(v[2]), em: Number(v[3]), pl: Number(pls[pls.length - 1][1]) };
}
// 獨立重算：外在 = 0.8·100·σ·√(DTE/365)，DTE = 7 − t；內在 = |跳幅|
const ext = (iv, t) => 0.8 * 100 * (iv / 100) * Math.sqrt(Math.max(0, 7 - t) / 365);
const finalPl = (entryIv, entryT, move) => (Math.abs(move) - ext(entryIv, entryT)) / ext(entryIv, entryT) * 100;

describe('IVCrushAnimator：預設情境（Ch18 widget：T-7、跳幅 +7%）', () => {
  const { text } = render(IVC, { entryDay: -7, actualMovePct: 7 });
  const r = parse(text);
  test('結論為 ❌ 虧損（不是獲利），約 −19%', () => {
    assert.equal(r.icon, '❌');
    assert.equal(r.pl, -19);
    assert.ok(text.includes('典型反例'));
  });
  test('Expected Move 顯示 ±8.6%（= 進場 straddle 價值，spot 正規化 100）', () => {
    assert.equal(r.em, 8.6);
    assert.ok(Math.abs(r.em - ext(55, -7)) < 0.05);
  });
  test('不可出現四位數百分比（舊版 +2323% 假獲利回歸防線）', () => {
    assert.ok(!/[+-]\d{4,}%/.test(text), '出現 ≥1000% 的報酬');
  });
  test('callout 為 warn 樣式（非 success）', () => {
    assert.ok(/class="callout warn"/.test(render(IVC, { entryDay: -7, actualMovePct: 7 }).html));
  });
  test('時間軸 P/L：進場點 +0%，財報前因 IV 上升而浮盈，財報後 T+7 轉虧', () => {
    const pls = [...text.matchAll(/([+-]\d+)%/g)].map(m => Number(m[1]));
    // 依序：T-7 +0、T-3 +15、T-1 +17、T+0 +20、T+7 −19
    assert.deepEqual(pls.slice(0, 5), [0, 15, 17, 20, -19]);
  });
});

describe('IVCrushAnimator：手算答案（WIP 驗證值）', () => {
  const cases = [
    [-7, 12.5, '✅', 45], [-1, 7, '❌', -30], [-14, 7, '🟡', 4], [-3, 7, '❌', -30],
  ];
  for (const [day, move, icon, pl] of cases) {
    test(`進場 T${day}、跳幅 ${move}% → ${icon} ${pl}%`, () => {
      const r = parse(render(IVC, { entryDay: day, actualMovePct: move }).text);
      const iv = IVC.PHASES.find(p => p.t === day).ivPct;
      assert.equal(r.icon, icon);
      assert.equal(r.pl, Math.round(finalPl(iv, day, move)));
      assert.equal(r.pl, pl);
    });
  }
  test('straddleValue：到期（t=7）只剩內在價值 = |跳幅|', () => {
    assert.equal(IVC.straddleValue(28, 7, 12), 12);
    assert.equal(IVC.straddleValue(28, 7, -12), 12);
  });
});

describe('IVCrushAnimator：性質與邊界', () => {
  test('跳幅正負對稱（straddle 不看方向）', () => {
    for (const m of [3, 7, 15, 25]) {
      assert.deepEqual(parse(render(IVC, { entryDay: -7, actualMovePct: m }).text),
        { ...parse(render(IVC, { entryDay: -7, actualMovePct: -m }).text), move: m });
    }
  });
  test('同跳幅下，越晚進場（IV 越高）虧越多：T-14 > T-7 > T-3 > T-1（模型值嚴格遞減、顯示值不遞增）', () => {
    const raw = [-14, -7, -3, -1].map(d => finalPl(IVC.PHASES.find(p => p.t === d).ivPct, d, 7));
    for (let i = 1; i < raw.length; i++) assert.ok(raw[i] < raw[i - 1], `${raw}`);
    const shown = [-14, -7, -3, -1].map(d => parse(render(IVC, { entryDay: d, actualMovePct: 7 }).text).pl);
    for (let i = 1; i < shown.length; i++) assert.ok(shown[i] <= shown[i - 1], `${shown}`);
  });
  test('跳幅 0%：全損 −100%（到期無內在價值）', () => {
    assert.equal(parse(render(IVC, { entryDay: -7, actualMovePct: 0 }).text).pl, -100);
  });
  test('滑桿上下限 ±25% 與四個進場點皆無 NaN / Infinity', () => {
    for (const d of [-14, -7, -3, -1]) for (const m of [-25, -0.5, 0, 0.5, 25]) {
      assert.deepEqual(badTokens(render(IVC, { entryDay: d, actualMovePct: m }).text), []);
    }
  });
  test('IV 時間軸：財報前遞增、財報後崩跌（T-1 85% → T+0 30%）', () => {
    const iv = [...IVC.PHASES.map(p => p.ivPct)];
    assert.deepEqual(iv, [35, 55, 75, 85, 30, 28]);
  });
  test('hydrate 讀 data-entry-day / data-actual-move-pct', () => {
    const w = fakeWidget({ 'data-entry-day': '-3', 'data-actual-move-pct': '12.5' });
    IVC.hydrate(w);
    assert.ok(w.body.innerHTML.includes('selected>T-3'));
  });
});

describe('IVCrushAnimator：已知疑似 bug（todo）', () => {
  test.todo('hydrate：data-actual-move-pct="0" 應為 0%，目前 `|| 7` 把 0 當缺值改成 7%', () => {
    const w = fakeWidget({ 'data-entry-day': '-7', 'data-actual-move-pct': '0' });
    IVC.hydrate(w);
    assert.ok(/value="0"/.test(w.body.innerHTML));
  });
});
