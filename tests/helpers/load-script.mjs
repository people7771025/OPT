// 測試輔助：從 index.html 抽出主腳本，在 node:vm 沙箱以最小假 DOM 載入。
// 原則：不改 index.html 一個字；只在沙箱裡「附加」一行把頂層 const 匯出到 globalThis.__OPT。
// 沙箱內 fetch 一律丟錯（不得連外），localStorage 為記憶體版。
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(here, '..', '..');
export const INDEX_PATH = path.join(REPO_ROOT, 'index.html');

let _htmlCache = null;
export function readIndexHtml() {
  if (_htmlCache == null) _htmlCache = readFileSync(INDEX_PATH, 'utf8');
  return _htmlCache;
}
export function readRepoFile(rel) {
  return readFileSync(path.join(REPO_ROOT, rel), 'utf8');
}

/** 列出所有 inline <script>（無 src）的內容與起始行號 */
export function listInlineScripts(html = readIndexHtml()) {
  const out = [];
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    const attrs = m[1] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;
    const line = html.slice(0, m.index).split('\n').length;
    out.push({ attrs, code: m[2], line });
  }
  return out;
}

/** 主腳本：含 `const Math2 =` 的那一段（不寫死行號，避免內容增減後失效） */
export function extractMainScript(html = readIndexHtml()) {
  const s = listInlineScripts(html).find(x => /const Math2\s*=/.test(x.code));
  if (!s) throw new Error('index.html 找不到含 Math2 的主腳本');
  return s.code;
}

/** window.V2 設定那段腳本 */
export function extractV2Config(html = readIndexHtml()) {
  const s = listInlineScripts(html).find(x => /window\.V2\s*=/.test(x.code));
  if (!s) throw new Error('index.html 找不到 window.V2 設定');
  return s.code;
}

/* ---------------- 最小假 DOM ---------------- */
export class FakeClassList {
  constructor() { this._s = new Set(); }
  add(...c) { c.forEach(x => this._s.add(x)); }
  remove(...c) { c.forEach(x => this._s.delete(x)); }
  toggle(c, force) {
    const on = force === undefined ? !this._s.has(c) : !!force;
    on ? this._s.add(c) : this._s.delete(c);
    return on;
  }
  contains(c) { return this._s.has(c); }
}

export class FakeElement {
  constructor(tag = 'div') {
    this.tagName = String(tag).toUpperCase();
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.style = {};
    this.dataset = {};
    this.classList = new FakeClassList();
    this.children = [];
    this.attributes = {};
    this.listeners = {};
  }
  setAttribute(k, v) { this.attributes[k] = String(v); }
  getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
  removeAttribute(k) { delete this.attributes[k]; }
  addEventListener(t, fn) { (this.listeners[t] ||= []).push(fn); }
  removeEventListener() {}
  appendChild(c) { this.children.push(c); return c; }
  insertAdjacentHTML() {}
  replaceWith() {}
  remove() {}
  // 回傳一個樁元件（非 null），讓「render 後 querySelector(...).addEventListener」的程式碼可執行；
  // 事件不會被觸發，測試只檢查 innerHTML。
  querySelector() { return new FakeElement('div'); }
  querySelectorAll() { return []; }
  closest() { return null; }
  getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }; }
  scrollIntoView() {}
  focus() {}
  click() {}
}

export function makeLocalStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    clear: () => m.clear(),
    key: i => [...m.keys()][i] ?? null,
    get length() { return m.size; },
    _map: m,
  };
}

function makeDocument() {
  const byId = new Map();
  const documentElement = new FakeElement('html');
  return {
    documentElement,
    body: new FakeElement('body'),
    visibilityState: 'visible',
    readyState: 'loading',
    getElementById(id) {
      if (!byId.has(id)) byId.set(id, new FakeElement('div'));
      return byId.get(id);
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: tag => new FakeElement(tag),
    addEventListener() {},
    removeEventListener() {},
  };
}

// 主腳本頂層宣告（const/function）。在 vm 裡 const 不會掛到 globalThis，故附加匯出。
const EXPORT_NAMES = [
  'Math2', 'esc', 'PayoffDiagram', 'GreeksLab', 'StockHedgeCalc', 'PreTradeChecklist',
  'StrategyPicker', 'MarginSimulator', 'IVTermStructure', 'VolSkewExplorer', 'Quiz',
  'PMCCBuilder', 'SyntheticBuilder', 'WheelSimulator', 'IVCrushAnimator',
  'LearningPathBuilder', 'IronCondorBuilder', 'TradeJournal', 'hydrateAll',
  'CloudSync', 'chapterLabel', 'getOrderedChapters',
];

/**
 * 載入主腳本，回傳 { api, window, localStorage, logs, fetchCalls }。
 * api 內含 Math2、各元件物件等。每次呼叫都是全新沙箱（測試間互不影響）。
 */
export function loadApp({ storage = {}, html = readIndexHtml() } = {}) {
  const code = extractMainScript(html);
  const localStorage = makeLocalStorage(storage);
  const sessionStorage = makeLocalStorage();
  const logs = { warn: [], error: [], log: [] };
  const fetchCalls = [];
  const document = makeDocument();
  const win = {
    document,
    localStorage,
    sessionStorage,
    console: {
      log: (...a) => logs.log.push(a), info: (...a) => logs.log.push(a),
      warn: (...a) => logs.warn.push(a), error: (...a) => logs.error.push(a),
    },
    navigator: { userAgent: 'node-test', onLine: false, clipboard: { writeText: async () => {} } },
    location: { hash: '', href: 'file:///index.html', origin: 'null', reload() {} },
    innerHeight: 800, innerWidth: 1200, scrollY: 0,
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    addEventListener() {}, removeEventListener() {},
    scrollTo() {},
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    requestAnimationFrame: () => 0,
    alert() {}, confirm: () => false, prompt: () => null,
    fetch: (...args) => { fetchCalls.push(args); throw new Error('測試沙箱禁止網路請求（fetch 已 stub）'); },
    IntersectionObserver: class { observe() {} unobserve() {} disconnect() {} },
    crypto: { getRandomValues: a => { for (let i = 0; i < a.length; i++) a[i] = (i * 7 + 3) % 256; return a; } },
    URL, URLSearchParams, TextEncoder, TextDecoder,
    Math, Date, JSON, Number, String, Array, Object, Set, Map, Promise, RegExp, Error,
    Intl, isFinite, isNaN, parseFloat, parseInt, Symbol, Infinity, NaN,
  };
  win.window = win;
  win.self = win;
  win.globalThis = win;
  const context = vm.createContext(win);
  const epilogue = `\n;globalThis.__OPT = { ${EXPORT_NAMES.map(n => `${n}: (typeof ${n} !== 'undefined' ? ${n} : undefined)`).join(', ')} };`;
  vm.runInContext(code + epilogue, context, { filename: 'index.html#main-script' });
  return { api: context.__OPT, window: context, localStorage, logs, fetchCalls };
}

/* ---------------- 渲染輔助 ---------------- */

/** HTML → 純文字（去標籤、解 entity、壓空白），方便對渲染結果做斷言 */
export function htmlToText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

/** 呼叫元件 render(container, state)，回傳 { html, text } */
export function render(component, state) {
  const c = new FakeElement('div');
  component.render(c, state);
  return { html: c.innerHTML, text: htmlToText(c.innerHTML) };
}

/** 從渲染文字取出「label 後第一個數字」：例如 statAfter(text, '最大獲利') → 123 */
export function numberAfter(text, label) {
  const i = text.indexOf(label);
  if (i < 0) throw new Error(`找不到標籤「${label}」`);
  const m = text.slice(i + label.length).match(/[-−+]?\$?\s*NT?\$?\s*([-−]?[\d,]+(?:\.\d+)?)/);
  if (!m) throw new Error(`「${label}」後面找不到數字`);
  const sign = /^[\s]*[-−]/.test(text.slice(i + label.length)) ? -1 : 1;
  return sign * Number(m[1].replace(/[,−]/g, ''));
}

/** 斷言字串內不含 NaN / Infinity / undefined 字樣（渲染防呆） */
export function badTokens(s) {
  return (String(s).match(/\bNaN\b|\bInfinity\b|\bundefined\b|\[object Object\]/g) || []);
}

/** 取所有 data-component 的 widget 標記（只看主腳本之前的 HTML 內容區） */
export function contentHtml(html = readIndexHtml()) {
  const i = html.indexOf('<script>\n"use strict"');
  return i > 0 ? html.slice(0, i) : html;
}

/** 解析某標籤的屬性字串（支援單引號、雙引號、無值屬性） */
export function parseAttrs(attrStr) {
  const out = {};
  const re = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let m;
  while ((m = re.exec(attrStr))) out[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  return out;
}

/** 解碼 HTML 屬性值中的 entity */
export function decodeAttr(v) {
  return String(v).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/** 從 i（指向 '<'）開始，找出尊重引號的標籤結尾 '>' 位置 */
export function tagEnd(src, i) {
  let q = null;
  for (let j = i + 1; j < src.length; j++) {
    const c = src[j];
    if (q) { if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '>') return j;
  }
  return -1;
}

/** 找出所有 data-component widget：[{ tag, type, attrs, line, start, end }]（屬性值內的 > 不會截斷） */
export function listWidgets(html = readIndexHtml()) {
  const body = contentHtml(html);
  const out = [];
  const re = /<([a-z]+)\b/g;
  let m;
  while ((m = re.exec(body))) {
    const end = tagEnd(body, m.index);
    if (end < 0) break;
    const inner = body.slice(m.index + 1 + m[1].length, end);
    const t = inner.match(/\bdata-component\s*=\s*["']([a-z-]+)["']/);
    if (t && !/^\s*$/.test(inner)) {
      const attrs = parseAttrs(inner);
      if (attrs['data-component'] === t[1]) {
        out.push({ tag: m[1], type: t[1], attrs, line: body.slice(0, m.index).split('\n').length, start: m.index, end });
      }
    }
    re.lastIndex = end;
  }
  return out;
}

/** 依 widget 屬性建一個假的 widget 元素（含 .widget-body），給 Component.hydrate 用 */
export function fakeWidget(attrs) {
  const w = new FakeElement('div');
  const body = new FakeElement('div');
  for (const [k, v] of Object.entries(attrs)) {
    if (!k.startsWith('data-')) continue;
    const key = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    w.dataset[key] = decodeAttr(v);
  }
  w.querySelector = sel => (sel === '.widget-body' ? body : null);
  w.body = body;
  return w;
}
