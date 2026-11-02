// 保護：CloudSync 的「不覆蓋、只聯集」合併規則（HANDOFF 設計決策：兩裝置都不丟資料）。
// 只測純函式 mergeKey / mergeData / snapshot / 同步碼驗證；不呼叫網路、不改同步協定。資料全為虛構。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp } from './helpers/load-script.mjs';

const plain = o => JSON.parse(JSON.stringify(o));

describe('CloudSync.mergeKey', () => {
  const { CloudSync: CS } = loadApp().api;
  test('已讀 / 已完成：兩邊聯集、去重', () => {
    assert.deepEqual(plain(CS.mergeKey('opt/visited', ['ch1', 'ch2'], ['ch2', 'ch3'])).sort(), ['ch1', 'ch2', 'ch3']);
    assert.deepEqual(plain(CS.mergeKey('opt/completed', ['ch5'], [])), ['ch5']);
  });
  test('完成時間：每章取較新的時間戳', () => {
    assert.deepEqual(plain(CS.mergeKey('opt/completed-ts', { ch1: 100, ch2: 500 }, { ch1: 300, ch3: 50 })), { ch1: 300, ch2: 500, ch3: 50 });
  });
  test('書籤：取 ts 較新者；相同 ts 以本機為準', () => {
    assert.equal(CS.mergeKey('opt/bookmark', { id: 'r', ts: 2 }, { id: 'l', ts: 1 }).id, 'r');
    assert.equal(CS.mergeKey('opt/bookmark', { id: 'r', ts: 1 }, { id: 'l', ts: 2 }).id, 'l');
    assert.equal(CS.mergeKey('opt/bookmark', { id: 'r', ts: 1 }, { id: 'l', ts: 1 }).id, 'l');
  });
  test('學習計畫：取 created 較新者', () => {
    assert.equal(CS.mergeKey('opt/learning-plan', { goal: 'r', created: 9 }, { goal: 'l', created: 3 }).goal, 'r');
  });
  test('交易日誌：依 id 聯集，同 id 以本機為準；沒有 id 的列被略過', () => {
    const merged = plain(CS.mergeKey('opt/trades',
      [{ id: 'a', pnl: '1' }, { id: 'b', pnl: '2' }, { pnl: '9' }],
      [{ id: 'b', pnl: '20' }, { id: 'c', pnl: '3' }]));
    const byId = Object.fromEntries(merged.map(t => [t.id, t.pnl]));
    assert.deepEqual(byId, { a: '1', b: '20', c: '3' });
  });
  test('數字 id 與字串 id 視為同一筆（String(id) 比對）', () => {
    assert.equal(CS.mergeKey('opt/trades', [{ id: 1, v: 'r' }], [{ id: '1', v: 'l' }]).length, 1);
  });
  test('壞資料（非陣列 / 非物件 / null）不丟例外', () => {
    for (const k of ['opt/visited', 'opt/completed', 'opt/completed-ts', 'opt/bookmark', 'opt/learning-plan', 'opt/trades']) {
      assert.doesNotThrow(() => CS.mergeKey(k, 'garbage', null), k);
      assert.doesNotThrow(() => CS.mergeKey(k, null, 42), k);
    }
  });
});

describe('CloudSync.mergeData', () => {
  const { CloudSync: CS } = loadApp().api;
  test('只存在一邊的 key 原樣保留', () => {
    assert.deepEqual(plain(CS.mergeData({ 'opt/visited': ['ch1'] }, { 'opt/completed': ['ch2'] })), { 'opt/visited': ['ch1'], 'opt/completed': ['ch2'] });
  });
  test('remote 為 null（雲端尚無資料）→ 等於本機資料', () => {
    const local = { 'opt/visited': ['ch1'], 'opt/trades': [{ id: 'x' }] };
    assert.deepEqual(plain(CS.mergeData(null, local)), local);
  });
  test('冪等：merge(merge(r,l), l) = merge(r,l)', () => {
    const r = { 'opt/visited': ['ch1'], 'opt/trades': [{ id: 'a' }], 'opt/completed-ts': { ch1: 5 } };
    const l = { 'opt/visited': ['ch2'], 'opt/trades': [{ id: 'b' }], 'opt/completed-ts': { ch1: 7 } };
    const once = plain(CS.mergeData(r, l));
    assert.deepEqual(plain(CS.mergeData(once, l)), once);
  });
  test('交換律（聯集型 key）：兩台裝置互相同步後已讀集合相同', () => {
    const a = { 'opt/visited': ['ch1', 'ch4'] }, b = { 'opt/visited': ['ch2'] };
    assert.deepEqual(plain(CS.mergeData(a, b))['opt/visited'].sort(), plain(CS.mergeData(b, a))['opt/visited'].sort());
  });
});

describe('CloudSync：snapshot 與同步碼', () => {
  test('snapshot 只收同步白名單的 key，壞 JSON 跳過；不含 API key、主題等裝置偏好', () => {
    const { api } = loadApp({ storage: {
      'opt/visited': '["ch1"]', 'opt/completed': '{bad', 'opt/state-v1': '{"theme":"dark"}', 'opt/gemini-key': '"not-a-real-key"',
    } });
    assert.deepEqual(plain(api.CloudSync.snapshot()), { 'opt/visited': ['ch1'] });
  });
  test('同步碼：16 位英數；normalizeCode 去除空白與符號並轉大寫', () => {
    const { CloudSync: CS } = loadApp().api;
    assert.equal(CS.normalizeCode(' abcd-efgh ijkl mnpq '), 'ABCDEFGHIJKLMNPQ');
    assert.ok(CS.validCode('ABCDEFGHJKLMNPQR'));
    assert.ok(!CS.validCode('ABC'));
    assert.ok(!CS.validCode('ABCDEFGHJKLMNPQ!'));
  });
  test('genCode 產生 16 碼且只用去掉易混字元（0/O/1/I）的字母表', () => {
    const { CloudSync: CS } = loadApp().api;
    const c = CS.genCode();
    assert.equal(c.length, 16);
    assert.ok(CS.validCode(c));
    assert.ok(!/[0O1I]/.test(c), c);
  });
});
