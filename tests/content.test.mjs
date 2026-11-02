// 內容一致性靜態掃描（只讀 index.html / README.md，不執行頁面）。
// 保護：錨點導覽（WIP：曾全壞）、section id 唯一、滑桿／數字框範圍對齊（WIP：35 組已對齊）、
// Quiz 資料有效、標籤閉合、元件註冊、首頁宣稱數量、無外部資源載入。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {
  readIndexHtml, contentHtml, extractMainScript, extractV2Config, listWidgets, parseAttrs, decodeAttr,
  loadApp, fakeWidget, readRepoFile,
} from './helpers/load-script.mjs';

const html = readIndexHtml();
const body = contentHtml(html);
const script = extractMainScript(html);
const lineOf = (s, i) => s.slice(0, i).split('\n').length;

const sections = [...html.matchAll(/<section\b([^>]*)>/g)].map(m => ({ attrs: parseAttrs(m[1]), line: lineOf(html, m.index) }));
const chapterIds = sections.map(s => s.attrs['data-chapter']).filter(Boolean);
const staticIds = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]).filter(id => !id.includes('${'));
const anchorTargets = new Set([...chapterIds, ...staticIds]);

describe('① 錨點：所有 href="#..." 與「見 ChXX」都有對應目標', () => {
  test('靜態 href="#xxx"（含腳本模板中的字面錨點）全部可解析', () => {
    const missing = [];
    for (const m of html.matchAll(/href="#([^"$]*)"/g)) {
      if (m[1] && !anchorTargets.has(m[1])) missing.push(`#${m[1]} @${lineOf(html, m.index)}`);
    }
    assert.deepEqual(missing, []);
  });
  test('沒有空錨點 href="#"（點了會跳回頁首）', () => {
    assert.deepEqual([...body.matchAll(/href="#"/g)].map(m => lineOf(body, m.index)), []);
  });
  test('內文提到的 ChN（含「見 ChN」）皆為存在的章節', () => {
    const bad = [];
    for (const m of body.matchAll(/\bCh(\d+)\b/g)) if (!chapterIds.includes(`ch${m[1]}`)) bad.push(`Ch${m[1]} @${lineOf(body, m.index)}`);
    assert.deepEqual(bad, []);
  });
  test('StrategyPicker 推薦的 anchor 皆為空字串或存在的章節', () => {
    const anchors = [...script.matchAll(/anchor:\s*'([^']*)'/g)].map(m => m[1]);
    assert.ok(anchors.length >= 10);
    for (const a of anchors) assert.ok(a === '' || anchorTargets.has(a), a);
  });
  test('LearningPathBuilder 各目標的章節都存在', () => {
    const { LearningPathBuilder } = loadApp().api;
    for (const [k, g] of Object.entries(LearningPathBuilder.GOALS)) {
      if (g.chs === 'all') continue;
      for (const c of g.chs) assert.ok(chapterIds.includes(c), `${k}: ${c}`);
    }
    for (let i = 1; i <= 36; i++) assert.ok(chapterIds.includes(`ch${i}`), `「完整」路徑的 ch${i}`);
  });
  test('啟動時會把 data-chapter 補成 section id（錨點導覽依賴此行，WIP 2026-06-17 修復）', () => {
    assert.match(script, /querySelectorAll\('section\[data-chapter\]'\)\.forEach\(s => \{ if \(!s\.id\) s\.id = s\.dataset\.chapter; \}\)/);
    assert.match(html, /section\[data-chapter\]\s*\{\s*scroll-margin-top/);
  });
});

describe('② section：都有 data-chapter、不重複、id 不重複', () => {
  test('每個 <section> 都有 data-chapter', () => {
    assert.deepEqual(sections.filter(s => !s.attrs['data-chapter']).map(s => s.line), []);
  });
  test('data-chapter 不重複，共 43 個（ch1–ch36、opt-x1–x3、intro、cases、glossary、progress）', () => {
    assert.equal(new Set(chapterIds).size, chapterIds.length);
    assert.equal(chapterIds.length, 43);
    for (let i = 1; i <= 36; i++) assert.ok(chapterIds.includes(`ch${i}`), `ch${i}`);
  });
  test('靜態 id 不重複，也不與 data-chapter（啟動後會成為 id）撞名', () => {
    // 腳本模板中的 sync-status 出現在 CloudSync 面板 if/else 兩個互斥分支（同時只會渲染一個），列為允許
    const ALLOW_EXCLUSIVE = new Set(['sync-status']);
    const seen = new Map();
    for (const id of [...staticIds, ...chapterIds]) seen.set(id, (seen.get(id) || 0) + 1);
    assert.deepEqual([...seen].filter(([id, n]) => n > 1 && !ALLOW_EXCLUSIVE.has(id)).map(([id]) => id), []);
    const bodyIds = [...body.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(bodyIds).size, bodyIds.length, '內容區 id 必須唯一');
  });
  test('window.V2.order 涵蓋全部 40 個可讀章節，且只含存在的章節', () => {
    const ctx = { window: {} };
    vm.runInNewContext(extractV2Config(html), ctx);
    const order = ctx.window.V2.order;
    assert.equal(order.length, 40);
    assert.equal(new Set(order).size, 40);
    for (const c of order) assert.ok(chapterIds.includes(c), c);
  });
});

describe('③ 滑桿（range）與配對數字框（number）範圍一致', () => {
  const inputs = [...html.matchAll(/<input\b([^>]*)>/g)].map(m => ({ a: parseAttrs(m[1]), line: lineOf(html, m.index) }));
  const pairs = [];
  inputs.forEach((n, i) => {
    const r = inputs[i + 1];
    if (n.a.type !== 'number' || !r || r.a.type !== 'range') return;
    const key = x => x.a['data-input'] ?? x.a['data-idx'];
    if (key(n) !== undefined && key(n) === key(r)) pairs.push({ n: n.a, r: r.a, line: n.line, key: key(n) });
  });
  test('原始碼中共有 35 組 number+range 配對', () => {
    assert.equal(pairs.length, 35);
  });
  test('每組 min、max 字面完全相同（含模板運算式）', () => {
    const bad = pairs.filter(p => p.n.min !== p.r.min || p.n.max !== p.r.max).map(p => `${p.key}@${p.line}`);
    assert.deepEqual(bad, []);
  });
  test('step：數字框不得比滑桿粗，且滑桿 step 為數字框 step 的整數倍（6 組刻意讓數字框更精細）', () => {
    let finer = 0;
    for (const p of pairs) {
      const ns = Number(p.n.step), rs = Number(p.r.step);
      if (!Number.isFinite(ns) || !Number.isFinite(rs)) continue;
      assert.ok(ns <= rs, `${p.key}@${p.line}: number step ${ns} > range step ${rs}`);
      const k = rs / ns;
      assert.ok(Math.abs(k - Math.round(k)) < 1e-9, `${p.key}@${p.line}: ${rs}/${ns}`);
      if (ns < rs) finer++;
    }
    assert.equal(finer, 6);
  });
  test('實際 hydrate 每個 widget 後：配對 min/max 相同，且預設值落在 [min, max] 內', () => {
    const { api } = loadApp();
    const map = { payoff: 'PayoffDiagram', greeks: 'GreeksLab', hedge: 'StockHedgeCalc', margin: 'MarginSimulator', ivterm: 'IVTermStructure',
      skew: 'VolSkewExplorer', pmcc: 'PMCCBuilder', synthetic: 'SyntheticBuilder', wheel: 'WheelSimulator', ivcrush: 'IVCrushAnimator', ic: 'IronCondorBuilder' };
    let checked = 0;
    for (const w of listWidgets()) {
      if (!map[w.type]) continue;
      const fw = fakeWidget(w.attrs);
      api[map[w.type]].hydrate(fw);
      const ins = [...fw.body.innerHTML.matchAll(/<input\b([^>]*)>/g)].map(m => parseAttrs(m[1]));
      for (let i = 0; i < ins.length; i++) {
        const a = ins[i];
        if (a.type !== 'number' && a.type !== 'range') continue;
        const [v, lo, hi] = [Number(a.value), Number(a.min), Number(a.max)];
        assert.ok(v >= lo - 1e-9 && v <= hi + 1e-9, `${w.type}@${w.line} ${a['data-input'] ?? a['data-idx']}: ${v} ∉ [${lo},${hi}]`);
        if (a.type === 'number' && ins[i + 1]?.type === 'range') {
          assert.equal(a.min, ins[i + 1].min); assert.equal(a.max, ins[i + 1].max);
        }
        checked++;
      }
    }
    assert.ok(checked >= 60, `只檢查到 ${checked} 個 input`);
  });
});

describe('④ Quiz 資料', () => {
  const quizWidgets = listWidgets().filter(w => w.type === 'quiz');
  const quizzes = quizWidgets.map(w => ({ line: w.line, qs: JSON.parse(decodeAttr(w.attrs['data-questions'])) }));
  test('9 個 Quiz 元件，data-questions 皆為可解析的非空陣列', () => {
    assert.equal(quizWidgets.length, 9);
    for (const q of quizzes) assert.ok(Array.isArray(q.qs) && q.qs.length > 0, `@${q.line}`);
  });
  test('每題：有題幹、≥2 個選項、correct 為選項範圍內整數、有解析', () => {
    for (const { line, qs } of quizzes) qs.forEach((q, i) => {
      const at = `@${line} #${i + 1}`;
      assert.ok(typeof q.q === 'string' && q.q.trim(), at);
      assert.ok(Array.isArray(q.opts) && q.opts.length >= 2, at);
      assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < q.opts.length, at);
      assert.ok(typeof q.explain === 'string' && q.explain.trim().length >= 4, at);
      assert.equal(new Set(q.opts).size, q.opts.length, `${at} 選項重複`);
    });
  });
  test('Quiz 之間沒有重複題目', () => {
    const all = quizzes.flatMap(q => q.qs.map(x => x.q.trim()));
    assert.equal(new Set(all).size, all.length);
  });

  const ctx = { window: {} };
  vm.runInNewContext(extractV2Config(html), ctx);
  const V2 = ctx.window.V2;
  const qEntries = Object.entries(V2.q);
  test(`段落練習（window.V2.q）：每題 id 與 key 一致、answer 在選項內、有解析、章節存在（共 ${qEntries.length} 題）`, () => {
    assert.ok(qEntries.length >= 100);
    for (const [id, q] of qEntries) {
      assert.equal(q.id, id);
      assert.ok(q.question && q.question.trim(), id);
      assert.ok(Object.keys(q.options).length >= 2, id);
      assert.ok(Object.hasOwn(q.options, q.answer), `${id} answer=${q.answer}`);
      assert.ok(q.explanation && q.explanation.trim().length >= 4, id);
      assert.ok(chapterIds.includes(q.chapter), `${id} chapter=${q.chapter}`);
    }
  });
  test('段落練習：題幹不重複', () => {
    const qs = qEntries.map(([, q]) => q.question.trim());
    const dup = qs.filter((q, i) => qs.indexOf(q) !== i);
    assert.deepEqual(dup, []);
  });
  test('.v2-quiz 插槽引用的題目 id 都存在，且每題只被一個插槽引用', () => {
    const used = [];
    for (const m of body.matchAll(/<div class="v2-quiz"([^>]*)>/g)) {
      const a = parseAttrs(m[1]);
      for (const id of (a['data-qids'] || '').split(',').filter(Boolean)) {
        assert.ok(V2.q[id], `${id} @${lineOf(body, m.index)}`);
        used.push(id);
      }
      assert.ok(chapterIds.includes(a['data-chapter']), a['data-chapter']);
    }
    assert.equal(new Set(used).size, used.length);
  });
});

describe('⑤ 標籤閉合與元件初始化', () => {
  const count = (re, s = body) => (s.match(re) || []).length;
  for (const tag of ['section', 'details', 'summary', 'table', 'tr', 'ul', 'ol', 'svg', 'script', 'style']) {
    test(`<${tag}> 開啟與關閉數量相同`, () => {
      const src = tag === 'script' || tag === 'style' ? html : body;
      assert.equal(count(new RegExp(`<${tag}\\b`, 'g'), src), count(new RegExp(`</${tag}>`, 'g'), src));
    });
  }
  test('<div> 開啟與關閉數量相同（內容區）', () => {
    assert.equal(count(/<div\b/g), count(/<\/div>/g));
  });
  test('<section> 不巢狀（每個 section 在下一個開始前關閉）', () => {
    let depth = 0, max = 0;
    for (const m of body.matchAll(/<(\/?)section\b/g)) { depth += m[1] ? -1 : 1; max = Math.max(max, depth); assert.ok(depth >= 0); }
    assert.equal(max, 1);
  });
  test('每個 <details> 都有 <summary>', () => {
    for (const m of body.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)) assert.match(m[1], /<summary\b/, `@${lineOf(body, m.index)}`);
  });
  test('沒有元素同時帶兩個 data-component', () => {
    assert.deepEqual([...body.matchAll(/<[^>]*data-component=[^>]*data-component=[^>]*>/g)].map(m => lineOf(body, m.index)), []);
  });
  test('每個 widget 都有 .widget-body 容器', () => {
    for (const w of listWidgets()) {
      assert.match(body.slice(w.end, w.end + 800), /class="widget-body"/, `${w.type}@${w.line}`);
    }
  });
  test('hydrateAll：HTML 用到的元件類型與註冊類型一一對應、每種只註冊一次', () => {
    const registered = [...script.matchAll(/safeHydrate\('\[data-component="([a-z]+)"\]'/g)].map(m => m[1]);
    const used = [...new Set(listWidgets().map(w => w.type))].sort();
    assert.equal(new Set(registered).size, registered.length);
    assert.deepEqual([...registered].sort(), used);
  });
  test('每個註冊元件的 hydrate 都能在預設資料上執行（不落入「載入失敗」佔位）', () => {
    const { api, logs } = loadApp();
    const map = { payoff: 'PayoffDiagram', greeks: 'GreeksLab', hedge: 'StockHedgeCalc', pretrade: 'PreTradeChecklist', picker: 'StrategyPicker',
      margin: 'MarginSimulator', ivterm: 'IVTermStructure', skew: 'VolSkewExplorer', quiz: 'Quiz', pmcc: 'PMCCBuilder', synthetic: 'SyntheticBuilder',
      wheel: 'WheelSimulator', ivcrush: 'IVCrushAnimator', ic: 'IronCondorBuilder', journal: 'TradeJournal', path: 'LearningPathBuilder' };
    for (const w of listWidgets()) {
      const fw = fakeWidget(w.attrs);
      assert.doesNotThrow(() => api[map[w.type]].hydrate(fw), `${w.type}@${w.line}`);
      assert.ok(fw.body.innerHTML.length > 50, `${w.type}@${w.line} 沒有輸出`);
      assert.ok(!/NaN|undefined/.test(fw.body.innerHTML.replace(/<script[\s\S]*?<\/script>/g, '')), `${w.type}@${w.line} 含 NaN/undefined`);
    }
    assert.deepEqual(logs.error, []);
  });
});

describe('⑥ 宣稱數量與實際一致', () => {
  const intro = body.slice(body.indexOf('完整版範圍'), body.indexOf('完整版範圍') + 1500);
  test('首頁「35 章（Ch1–Ch35）+ 實戰日誌（Ch36）」：ch1–ch36 皆存在', () => {
    assert.match(intro, /<b>35 章<\/b>（Ch1–Ch35/);
    assert.equal(chapterIds.filter(c => /^ch\d+$/.test(c)).length, 36);
  });
  test('首頁「14 個互動元件」＝ 列出的 14 個名稱，皆為實際註冊的元件（不含 Quiz 與 LearningPathBuilder）', () => {
    assert.match(intro, /<b>14 個互動元件<\/b>/);
    const listed = (intro.match(/<b>14 個互動元件<\/b>（([^）]+)）/) || [])[1].replace(/<[^>]+>/g, '').split('·').map(s => s.trim());
    assert.equal(listed.length, 14);
    for (const name of listed) assert.match(script, new RegExp(`const ${name} = \\{`), name);
    const types = new Set(listWidgets().map(w => w.type));
    types.delete('quiz'); types.delete('path');
    assert.equal(types.size, 14);
  });
  test('首頁「11 個實戰案例」＝ 案例庫 ①–⑪', () => {
    assert.match(intro, /<b>11 個實戰案例<\/b>/);
    const cases = body.slice(body.indexOf('data-chapter="cases"'), body.indexOf('data-chapter="ch20"'));
    const marks = new Set([...cases.matchAll(/案例 ([①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮])/g)].map(m => m[1]));
    assert.equal(marks.size, 11);
  });
  test('首頁「9 個 Quiz」＝ quiz 元件數', () => {
    assert.match(intro, /<b>9 個 Quiz<\/b>/);
    assert.equal(listWidgets().filter(w => w.type === 'quiz').length, 9);
  });
  test('LearningPathBuilder「完整」目標宣稱「全部 11 個」案例', () => {
    assert.match(script, /chs: 'all', cases: '全部 11 個'/);
  });
  test('README 的 Part 範圍與章首「全書第 N/40 章」一致（40 = 36 章 + opt-x1~3 + 案例庫）', () => {
    const n = [...body.matchAll(/全書第 (\d+)\/40 章/g)].map(m => Number(m[1]));
    assert.equal(n.length, 40);
    assert.deepEqual([...n].sort((a, b) => a - b), Array.from({ length: 40 }, (_, i) => i + 1));
    assert.match(readRepoFile('README.md'), /實戰場景案例庫/);
  });
});

describe('⑦ 無外部資源載入（維持單檔離線可開）', () => {
  test('沒有外部 <script src>、<link href>、<img src>、<iframe>、CSS url()/@import', () => {
    assert.deepEqual([...html.matchAll(/<(script|img|iframe|source|video|audio|embed)\b[^>]*\bsrc\s*=\s*["']https?:/gi)].map(m => lineOf(html, m.index)), []);
    assert.deepEqual([...html.matchAll(/<link\b[^>]*\bhref\s*=\s*["']https?:/gi)].map(m => lineOf(html, m.index)), []);
    assert.deepEqual([...html.matchAll(/url\(\s*["']?https?:/gi)].map(m => lineOf(html, m.index)), []);
    assert.deepEqual([...html.matchAll(/@import\s/gi)].map(m => lineOf(html, m.index)), []);
    assert.ok(!/<iframe\b/i.test(html));
  });
  test('唯一的外部 script 是同目錄的 ./v2.js', () => {
    const srcs = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/g)].map(m => m[1]);
    assert.deepEqual(srcs, ['./v2.js']);
  });
  test('fetch 目的地僅限使用者主動啟用的兩個端點（雲端同步 Worker、自帶 key 的 Gemini）', () => {
    const urls = [...script.matchAll(/https?:\/\/[^\s'"`)<>]+/g)].map(m => m[0])
      .filter(u => !u.startsWith('http://www.w3.org/'));
    const allowed = [/^https:\/\/opt-sync\.[a-z0-9-]+\.workers\.dev\/v1\/sync$/, /^https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\//, /^https:\/\/aistudio\.google\.com\/apikey$/];
    for (const u of urls) assert.ok(allowed.some(r => r.test(u)), u);
    const fetchCalls = [...script.matchAll(/\bfetch\(/g)].length;
    assert.ok(fetchCalls >= 1 && fetchCalls <= 4, `fetch 呼叫 ${fetchCalls} 處`);
  });
  test('內容區外部連結只出現在 <a href>（文字連結）', () => {
    for (const m of body.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
      if (m[0].startsWith('http://www.w3.org/')) continue;
      const before = body.slice(Math.max(0, m.index - 300), m.index);
      assert.match(before, /<a\b[^>]*href=["']$/, `${m[0]} @${lineOf(body, m.index)}`);
    }
  });
  test('v2.js / v2.css 沒有外部 URL', () => {
    for (const f of ['v2.js', 'v2.css']) assert.ok(!/https?:\/\//.test(readRepoFile(f)), f);
  });
  test('沒有 service worker 註冊', () => {
    assert.ok(!/serviceWorker\.register/.test(html + readRepoFile('v2.js')));
  });
});
