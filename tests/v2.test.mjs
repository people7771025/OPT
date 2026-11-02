// 保護：v2.js（段落內嵌練習 + Leitner 間隔複習）。localStorage key 名稱與資料格式不可變（跨裝置/舊進度相容）。
// 題目為虛構測試題，不使用 index.html 的題庫。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readRepoFile, FakeElement, makeLocalStorage } from './helpers/load-script.mjs';

const DAY = 864e5;
const NOW = Date.UTC(2026, 10, 2, 1, 0, 0); // 2026-11-02 09:00 台北
const Q = (id, chapter, answer = 'A') => ({ id, chapter, question: `虛構題 ${id}`, options: { A: '甲', B: '乙' }, answer, explanation: `解析 ${id}` });

function run({ mode = 'public', slots, q, storage = {}, now = NOW, withBookmark = true }) {
  const ls = makeLocalStorage(storage);
  const slotEls = slots.map(([chapter, qids]) => { const e = new FakeElement('div'); e.dataset = { chapter, qids }; return e; });
  const stats = new FakeElement('div');
  const body = new FakeElement('body');
  const created = [];
  const document = {
    querySelectorAll: sel => (sel === '.v2-quiz' ? slotEls : []),
    getElementById: id => (id === 'v2-stats' ? stats : id === 'set-bookmark-btn' && withBookmark ? new FakeElement('button') : null),
    createElement: tag => { const e = new FakeElement(tag); created.push(e); return e; },
    body,
  };
  let clock = now;
  class FixedDate extends Date { static now() { return clock; } }
  const ctx = vm.createContext({ window: { V2: { subj: 'opt', mode, order: [], q } }, document, localStorage: ls, Date: FixedDate, JSON, Math, Object, String, Set });
  vm.runInContext(readRepoFile('v2.js'), ctx);
  const cards = slotEls.map(s => s.children[0] || null);
  // 模擬作答：對卡片內第 n 題按下選項 k
  const answer = (card, idx, k) => {
    const qEl = card.children[idx];
    const btn = { dataset: { k }, disabled: false, classList: new FakeElement().classList };
    qEl.listeners.click[0]({ target: { closest: () => btn } });
  };
  return { ls, slotEls, stats, body, cards, answer, created, setClock: t => { clock = t; } };
}

const KEY = 'opt/v2-srs';

describe('v2.js：初始化與卡片', () => {
  const q = { a1: Q('a1', 'ch1'), a2: Q('a2', 'ch1'), b1: Q('b1', 'ch4') };
  const r = run({ slots: [['ch1', 'a1'], ['ch1', 'a2'], ['ch4', 'b1,zz']], q });
  test('每個有題目的插槽都附上一張卡片；不存在的題號（zz）被忽略', () => {
    assert.equal(r.cards.filter(Boolean).length, 3);
    assert.equal(r.cards[2].children.length, 1);
  });
  test('章內非最後插槽標「本段練習」，章末插槽標「章末練習」', () => {
    assert.match(r.cards[0].innerHTML, /本段練習/);
    assert.match(r.cards[1].innerHTML, /章末練習/);
  });
  test('統計列：已做 0/3、正確率 0%、待複習 0', () => {
    assert.match(r.stats.innerHTML, /已做 <b>0<\/b>\/3 題 · 正確率 <b>0%<\/b>/);
    assert.match(r.stats.innerHTML, /待複習 <b>0<\/b>/);
  });
  test('手機浮動圖釘按鈕只建立一次', () => {
    assert.equal(r.body.children.filter(c => c.className === 'v2-fab').length, 1);
  });
  test('沒有 #set-bookmark-btn 時不建立浮動按鈕', () => {
    const r2 = run({ slots: [['ch1', 'a1']], q, withBookmark: false });
    assert.equal(r2.body.children.length, 0);
  });
  test('沒有 window.V2 時整段不執行（不丟例外）', () => {
    const ctx = vm.createContext({ window: {}, document: { querySelectorAll: () => { throw new Error('should not run'); } } });
    assert.doesNotThrow(() => vm.runInContext(readRepoFile('v2.js'), ctx));
  });
  test('題目文字經 HTML 跳脫（不注入標籤）', () => {
    const r3 = run({ slots: [['ch1', 'x']], q: { x: { ...Q('x', 'ch1'), question: '<img src=x onerror=1>' } } });
    assert.ok(!r3.cards[0].children[0].innerHTML.includes('<img'));
    assert.match(r3.cards[0].children[0].innerHTML, /&lt;img/);
  });
});

describe('v2.js：Leitner 紀錄（key 與格式固定）', () => {
  const q = { a1: Q('a1', 'ch1', 'A'), a2: Q('a2', 'ch1', 'B') };
  test('localStorage key 為 opt/v2-srs（public），private 模式為 opt/v2-srs-private', () => {
    const r = run({ slots: [['ch1', 'a1']], q });
    r.answer(r.cards[0], 0, 'A');
    assert.ok(r.ls.getItem(KEY));
    const p = run({ mode: 'private', slots: [['ch1', 'a1']], q });
    p.answer(p.cards[0], 0, 'A');
    assert.ok(p.ls.getItem(KEY + '-private'));
    assert.equal(p.ls.getItem(KEY), null);
  });
  test('答對：box 0→1、n=1、c=1、due = now + 1 天', () => {
    const r = run({ slots: [['ch1', 'a1']], q });
    r.answer(r.cards[0], 0, 'A');
    const s = JSON.parse(r.ls.getItem(KEY)).a1;
    assert.deepEqual(s, { box: 1, n: 1, c: 1, last: NOW, due: NOW + 1 * DAY });
  });
  test('答錯：box 回到 1、c 不增、due = now + 10 分鐘', () => {
    const r = run({ slots: [['ch1', 'a1']], q, storage: { [KEY]: JSON.stringify({ a1: { box: 4, n: 4, c: 4, due: 0 } }) } });
    r.answer(r.cards[0], 0, 'B');
    const s = JSON.parse(r.ls.getItem(KEY)).a1;
    assert.equal(s.box, 1); assert.equal(s.n, 5); assert.equal(s.c, 4); assert.equal(s.due, NOW + 10 * 60e3);
  });
  test('連續答對：盒子間隔 1,3,7,14,30,60 天，最高停在第 6 盒', () => {
    const r = run({ slots: [['ch1', 'a1']], q });
    const IV = [1, 3, 7, 14, 30, 60, 60];
    for (let i = 0; i < 7; i++) {
      r.answer(r.cards[0], 0, 'A');
      const s = JSON.parse(r.ls.getItem(KEY)).a1;
      assert.equal(s.box, Math.min(i + 1, 6));
      assert.equal(s.due, NOW + IV[i] * DAY);
    }
  });
  test('作答後統計列更新：已做 1/2、正確率 100%', () => {
    const r = run({ slots: [['ch1', 'a1,a2']], q });
    r.answer(r.cards[0], 0, 'A');
    assert.match(r.stats.innerHTML, /已做 <b>1<\/b>\/2 題 · 正確率 <b>100%<\/b>/);
  });
  test('localStorage 內容損毀時從空狀態開始，不丟例外', () => {
    assert.doesNotThrow(() => run({ slots: [['ch1', 'a1']], q, storage: { [KEY]: '{oops' } }));
  });
});

describe('v2.js：間隔複習插入', () => {
  const q = { a1: Q('a1', 'ch1'), a2: Q('a2', 'ch1'), b1: Q('b1', 'ch4'), c1: Q('c1', 'ch2') };
  const due = { box: 1, n: 1, c: 0, due: NOW - 1 };
  // ⚠ 疑似 bug：v2.js 在處理每個插槽時先把「本段自己的題目」加入 used，而 dueReviews 排除 used，
  //   且候選題必須來自更早的插槽（早已加入 used）→ 複習永遠是空的。以下三項以 todo 記錄預期行為。
  test('現況釘住：到期題目目前不會被插入任何插槽（複習功能實際未生效）', () => {
    const r = run({ slots: [['ch1', 'a1'], ['ch4', 'b1']], q, storage: { [KEY]: JSON.stringify({ a1: due }) } });
    assert.equal(r.cards[1].children.length, 1);
    assert.match(r.stats.innerHTML, /待複習 <b>1<\/b>/); // 統計列卻顯示有 1 題待複習
  });
  test.todo('到期題目應插入「之後」的插槽，不會插到本身或之前', () => {
    const r = run({ slots: [['ch1', 'a1'], ['ch4', 'b1']], q, storage: { [KEY]: JSON.stringify({ a1: due }) } });
    assert.equal(r.cards[0].children.length, 1);      // 只有自己的題
    assert.equal(r.cards[1].children.length, 2);      // b1 + 複習 a1
    assert.match(r.cards[1].innerHTML, /1 題複習/);
  });
  test('未到期的題目不插入', () => {
    const r = run({ slots: [['ch1', 'a1'], ['ch4', 'b1']], q, storage: { [KEY]: JSON.stringify({ a1: { ...due, due: NOW + DAY } }) } });
    assert.equal(r.cards[1].children.length, 1);
  });
  test('同一題作為「複習」最多出現一次（不會在多個後續插槽重複）', () => {
    const r = run({ slots: [['ch1', 'a1'], ['ch4', 'b1'], ['ch2', 'c1']], q, storage: { [KEY]: JSON.stringify({ a1: due }) } });
    const asReview = r.cards.slice(1).reduce((s, c) => s + (c ? c.children.filter(x => x.dataset.id === 'a1').length : 0), 0);
    assert.ok(asReview <= 1, `a1 被複習 ${asReview} 次`);
  });
  test.todo('無自己題目的章末插槽只放複習（最多 3 題）並標「章末複習」', () => {
    const many = { a1: Q('a1', 'ch1'), a2: Q('a2', 'ch1'), a3: Q('a3', 'ch1'), a4: Q('a4', 'ch1') };
    const st = Object.fromEntries(Object.keys(many).map(k => [k, due]));
    const r = run({ slots: [['ch1', 'a1,a2,a3,a4'], ['ch4', '']], q: many, storage: { [KEY]: JSON.stringify(st) } });
    assert.equal(r.cards[1].children.length, 3);
    assert.match(r.cards[1].innerHTML, /章末複習/);
  });
  test.todo('複習排序：盒子小的優先', () => {
    const st = { a1: { ...due, box: 3 }, a2: { ...due, box: 1 } };
    const r = run({ slots: [['ch1', 'a1,a2'], ['ch4', 'b1']], q, storage: { [KEY]: JSON.stringify(st) } });
    // b1 自己 1 題 → 複習數 min(2, ceil(1/2)) = 1，應選 box 1 的 a2
    assert.equal(r.cards[1].children[1].dataset.id, 'a2');
  });
});
