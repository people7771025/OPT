// 保護：TradeJournal（Ch36）統計口徑、LearningPathBuilder 時數估算、Quiz 計分。
// 所有交易皆為虛構（代號 AAA/BBB/CCC、虛構金額），不含任何真實持倉。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { loadApp, render, badTokens } from './helpers/load-script.mjs';

const { TradeJournal: TJ, LearningPathBuilder: LP, Quiz } = loadApp().api;
const plain = o => JSON.parse(JSON.stringify(o)); // 跨 vm realm 比較用

const T = (id, strategy, ticker, pnl, date, status = 'closed', extra = {}) =>
  ({ id: `t${id}`, strategy, ticker, pnl: pnl == null ? '' : String(pnl), date, status, ...extra });
const SAMPLE = [
  T(1, 'CC', 'AAA', 120, '2026-01-05'),
  T(2, 'CC', 'AAA', -300, '2026-01-20'),
  T(3, 'CSP', 'BBB', 80, '2026-02-03'),
  T(4, 'CSP', 'BBB', 0, '2026-02-10'),          // 平手 scratch
  T(5, 'IC', 'CCC', -50, '2026-03-01'),
  T(6, 'IC', 'CCC', null, '2026-03-02'),         // 已平倉未填 P/L
  T(7, 'Long Call', 'AAA', null, '2026-03-03', 'open', { strike: '100', premium: '2', qty: '1' }),
];

describe('TradeJournal.stats：勝率分母排除平手與未填 P/L', () => {
  const s = plain(TJ.stats(SAMPLE));
  test('總筆數 7、open 1、已結含 P/L 5、待補 P/L 1', () => {
    assert.equal(s.total, 7); assert.equal(s.open, 1); assert.equal(s.closed, 5); assert.equal(s.closedPending, 1);
  });
  test('2 勝 2 負 1 平 → 勝率 50%（不是 2/5 = 40%）', () => {
    assert.equal(s.wins, 2); assert.equal(s.losses, 2); assert.equal(s.scratches, 1); assert.equal(s.winRate, 50);
  });
  test('累計 −150；平均贏 +100、平均輸 −175', () => {
    assert.equal(s.totalPnl, -150); assert.equal(s.avgWin, 100); assert.equal(s.avgLoss, -175);
  });
  test('空陣列：勝率 0，不除以 0', () => {
    const e = plain(TJ.stats([]));
    assert.equal(e.winRate, 0); assert.equal(e.avgWin, 0); assert.equal(e.avgLoss, 0);
  });
  test('只有平手：勝率 0（分母 0 時不出現 NaN）', () => {
    assert.equal(TJ.stats([T(1, 'CC', 'AAA', 0, '2026-01-01')]).winRate, 0);
  });
});

describe('TradeJournal：分組統計', () => {
  test('strategyStats：依筆數排序、各組勝率分母排除平手', () => {
    const g = plain(TJ.strategyStats(SAMPLE));
    const cc = g.find(x => x.strategy === 'CC'), csp = g.find(x => x.strategy === 'CSP'), ic = g.find(x => x.strategy === 'IC');
    assert.deepEqual([cc.wins, cc.losses, cc.pnl, cc.winRate], [1, 1, -180, 50]);
    assert.deepEqual([csp.wins, csp.scratches, csp.winRate], [1, 1, 100]);
    assert.deepEqual([ic.total, ic.winRate], [1, 0]); // 未填 P/L 那筆不算
    assert.ok(g.every((x, i) => i === 0 || g[i - 1].total >= x.total));
  });
  test('tickerStats：最多回傳 5 個標的', () => {
    const many = Array.from({ length: 8 }, (_, i) => T(i, 'CC', `Z${i}`, 10, '2026-01-01'));
    assert.equal(TJ.tickerStats(many).length, 5);
  });
  test('monthlyPnL：按月加總並累計（1 月 −180、2 月 +80 → 累計 −100、3 月 −50 → −150）', () => {
    assert.deepEqual(plain(TJ.monthlyPnL(SAMPLE)), [
      { month: '2026-01', monthly: -180, cumulative: -180 },
      { month: '2026-02', monthly: 80, cumulative: -100 },
      { month: '2026-03', monthly: -50, cumulative: -150 },
    ]);
  });
  test('monthlyPnL：輸入順序顛倒結果相同', () => {
    assert.deepEqual(plain(TJ.monthlyPnL([...SAMPLE].reverse())), plain(TJ.monthlyPnL(SAMPLE)));
  });
});

describe('TradeJournal.streakStatus', () => {
  test('依日期排序後取最近連續：3 連虧', () => {
    const tr = [T(1, 'CC', 'A', 50, '2026-01-01'), T(2, 'CC', 'A', -10, '2026-01-03'), T(3, 'CC', 'A', -20, '2026-01-02'), T(4, 'CC', 'A', -30, '2026-01-04')];
    assert.deepEqual(plain(TJ.streakStatus(tr)), { streak: 3, type: 'loss' });
  });
  test('最近一筆平手 → 中斷，回傳 null', () => {
    assert.equal(TJ.streakStatus([T(1, 'CC', 'A', 50, '2026-01-01'), T(2, 'CC', 'A', 0, '2026-01-02')]), null);
  });
  test('沒有已結交易 → null；非法日期不丟例外', () => {
    assert.equal(TJ.streakStatus([]), null);
    assert.doesNotThrow(() => TJ.streakStatus([T(1, 'CC', 'A', 5, 'not-a-date'), T(2, 'CC', 'A', 6, '2026-13-45')]));
  });
});

describe('TradeJournal.reviewHints（Journal Coach）', () => {
  test('沒有已結交易 → 只提示「先累積樣本」', () => {
    const h = plain(TJ.reviewHints([]));
    assert.equal(h.length, 1); assert.equal(h[0].title, '先累積樣本');
  });
  test('3 連虧 → 出現「連虧降部位」(danger)', () => {
    const tr = [1, 2, 3].map(i => T(i, 'CSP', 'A', -100, `2026-01-0${i}`));
    assert.ok(TJ.reviewHints(tr).some(h => h.tone === 'danger' && h.title === '連虧降部位'));
  });
  test('平均虧損 > 3 倍平均獲利 → 「虧損吃掉太多小贏」', () => {
    const tr = [T(1, 'IC', 'A', 50, '2026-01-01'), T(2, 'IC', 'A', -200, '2026-01-02'), T(3, 'IC', 'A', 60, '2026-01-03')];
    assert.ok(TJ.reviewHints(tr).some(h => h.title === '虧損吃掉太多小贏'));
  });
});

describe('TradeJournal：日期與時區邊界', () => {
  test('月份以日期字串切分，月底／月初分屬不同月份（不受執行環境時區影響）', () => {
    const tr = [T(1, 'CC', 'A', 10, '2026-01-31'), T(2, 'CC', 'A', 20, '2026-02-01')];
    assert.deepEqual(plain(TJ.monthlyPnL(tr)).map(m => m.month), ['2026-01', '2026-02']);
  });
  test('沒有日期的已結交易不進月損益，但仍計入勝率', () => {
    const tr = [T(1, 'CC', 'A', 10, ''), T(2, 'CC', 'A', -5, '2026-02-01')];
    assert.equal(TJ.monthlyPnL(tr).length, 1);
    assert.equal(TJ.stats(tr).winRate, 50);
  });
  test('open 超過 45 天 → Journal Coach 提示「未結部位太久」；30 天內不提示', () => {
    const iso = d => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
    const closed = [T(9, 'CC', 'A', 10, '2026-01-01')];
    assert.ok(TJ.reviewHints([...closed, T(1, 'CC', 'A', null, iso(60), 'open')]).some(h => h.title === '未結部位太久'));
    assert.ok(!TJ.reviewHints([...closed, T(1, 'CC', 'A', null, iso(30), 'open')]).some(h => h.title === '未結部位太久'));
  });
  test('重複 id 的交易各自計入（統計不去重，去重是匯入／同步層的責任）', () => {
    const tr = [T(1, 'CC', 'A', 10, '2026-01-01'), T(1, 'CC', 'A', 10, '2026-01-01')];
    assert.equal(TJ.stats(tr).closed, 2);
  });
  test('pnl 為非數字字串（如 "abc"）視為未結算，不污染勝率', () => {
    const s = TJ.stats([T(1, 'CC', 'A', 'abc', '2026-01-01'), T(2, 'CC', 'A', 10, '2026-01-02')]);
    assert.equal(s.closed, 1); assert.equal(s.closedPending, 1); assert.equal(s.winRate, 100);
  });
});

describe('TradeJournal.normalizeImport', () => {
  test('補 id、status 小寫化、未知 status 退回 closed、數值字串化', () => {
    const r = TJ.normalizeImport([{ status: 'OPEN', strike: 100, premium: '1.50', pnl: 30 }, { id: 'x', status: 'weird', pnl: null }]);
    const [a, b] = r.trades;
    assert.ok(a.id); assert.equal(a.status, 'open'); assert.equal(a.strike, '100'); assert.equal(a.premium, '1.5'); assert.equal(a.pnl, '30');
    assert.equal(b.id, 'x'); assert.equal(b.status, 'closed'); assert.equal(b.pnl, '');
    assert.equal(r.idFilled, 1); assert.equal(r.statusFixed, 1);
  });
  test('非物件列（null、字串）不丟例外', () => {
    assert.doesNotThrow(() => TJ.normalizeImport([null, 'x', 42]));
  });
});

describe('TradeJournal.exposureStats（粗估）', () => {
  test('沒有 open 部位 → hasData false', () => {
    assert.equal(TJ.exposureStats(SAMPLE.filter(t => t.status !== 'open')).hasData, false);
  });
  test('1 張 CSP K=100（虛構）→ 淨 delta +35 股、名目 10,000、風險 max(權利金×100, 名目×20%) = 2,000', () => {
    const e = TJ.exposureStats([T(1, 'CSP', 'AAA', null, '2026-01-01', 'open', { strike: '100', premium: '1.5', qty: '1' })]);
    assert.ok(Math.abs(e.netDelta - 35) < 1e-9);
    assert.equal(e.totalRisk, 2000);
    assert.equal(e.concPct, 100);
    assert.ok(e.totalTheta > 0, '賣方 theta 為正');
  });
  test('未知策略走「其他」、strike 空白不產生 NaN', () => {
    const e = TJ.exposureStats([T(1, '奇怪策略', 'AAA', null, '2026-01-01', 'open', { strike: '', premium: '', qty: '' })]);
    for (const k of ['netDelta', 'grossDelta', 'totalTheta', 'totalRisk', 'concPct']) assert.ok(Number.isFinite(e[k]), k);
  });
});

describe('LearningPathBuilder.computePlan', () => {
  test('完整系統學習 + 輕度 + 新手：36 章、64.8 小時、17 週', () => {
    const p = LP.computePlan('all', 'light', 'newbie');
    assert.equal(p.chapters.length, 36); assert.equal(p.totalHours, '64.8'); assert.equal(p.weeks, 17);
  });
  test('有經驗者略過 Ch1–4：32 章', () => {
    const p = LP.computePlan('all', 'heavy', 'experienced');
    assert.equal(p.chapters.length, 32);
    assert.ok(!p.chapters.includes('ch1') && !p.chapters.includes('ch4'));
    assert.equal(p.weeks, Math.ceil(32 * 1.8 / 12));
  });
  test('鎖股實作 + 中度：15 章、27.0 小時、4 週', () => {
    const p = LP.computePlan('lock-stock', 'medium', 'newbie');
    assert.equal(p.chapters.length, 15); assert.equal(p.totalHours, '27.0'); assert.equal(p.weeks, 4);
  });
  test('冪等：重複呼叫不改動 GOALS 內的章節陣列', () => {
    const before = JSON.stringify(LP.GOALS);
    LP.computePlan('tw-futures', 'light', 'experienced'); LP.computePlan('tw-futures', 'light', 'experienced');
    assert.equal(JSON.stringify(LP.GOALS), before);
  });
  test('三步驟問卷都能渲染、結果頁無 NaN', () => {
    for (const step of [0, 1, 2]) assert.deepEqual(badTokens(render(LP, { step, choices: { goal: 'arbitrage', hours: 'light' } }).text), []);
    assert.deepEqual(badTokens(render(LP, { step: 3, choices: { goal: 'arbitrage', hours: 'light', exp: 'newbie' } }).text), []);
  });
});

describe('Quiz 計分', () => {
  const qs = [
    { q: 'Q1', opts: ['a', 'b'], correct: 0, explain: 'e1' },
    { q: 'Q2', opts: ['a', 'b', 'c'], correct: 2, explain: 'e2' },
  ];
  test('1/2 → 50% · 需複習，錯題顯示正確答案', () => {
    const { text } = render(Quiz, { questions: qs, idx: 1, answers: [0, 1], showResult: true });
    assert.ok(text.includes('1 / 2')); assert.ok(text.includes('50% · 需複習')); assert.ok(text.includes('正確：c'));
  });
  test('全對 → 100% · 優秀；未作答顯示「未作答」', () => {
    assert.ok(render(Quiz, { questions: qs, idx: 1, answers: [0, 2], showResult: true }).text.includes('100% · 優秀'));
    assert.ok(render(Quiz, { questions: qs, idx: 1, answers: [], showResult: true }).text.includes('未作答'));
  });
  test('作答後顯示解析、最後一題出現「看結果」', () => {
    const { text } = render(Quiz, { questions: qs, idx: 1, answers: [0, 2], showResult: false });
    assert.ok(text.includes('解析： e2') || text.includes('解析：e2')); assert.ok(text.includes('看結果'));
  });
});
