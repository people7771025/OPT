// 保護：index.html 所有 inline <script> 與 v2.js 能被 JS parser 解析（WIP/HANDOFF 以 new Function() 手動驗證，
// 這裡自動化）；主腳本在 vm 沙箱可完整執行頂層程式碼，不呼叫網路。
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { listInlineScripts, readRepoFile, loadApp } from './helpers/load-script.mjs';

describe('語法檢查（new Function）', () => {
  const scripts = listInlineScripts();
  test('index.html 有 2 段 inline script（主程式 + window.V2 設定）', () => {
    assert.equal(scripts.length, 2);
  });
  for (const s of scripts) {
    test(`index.html 第 ${s.line} 行的 inline script 可解析`, () => {
      assert.doesNotThrow(() => new Function(s.code));
    });
  }
  test('v2.js 可解析', () => {
    assert.doesNotThrow(() => new Function(readRepoFile('v2.js')));
  });
  test('主腳本保持 "use strict"', () => {
    assert.match(scripts.find(s => /const Math2/.test(s.code)).code, /^\s*"use strict";/);
  });
});

describe('vm 沙箱執行主腳本', () => {
  test('頂層程式碼執行無例外、console.error 為空', () => {
    const { logs } = loadApp();
    assert.deepEqual(logs.error, []);
  });
  test('載入時不讀寫 localStorage 以外的狀態、不發網路請求（fetch 為會丟錯的 stub）', () => {
    assert.doesNotThrow(() => loadApp());
  });
  test('主題初始化：沒有存檔且系統非深色 → light，並寫入 documentElement.dataset.theme', () => {
    const { window } = loadApp();
    assert.equal(window.document.documentElement.dataset.theme, 'light');
  });
  test('主題初始化：localStorage 已存 dark → dark', () => {
    const { window } = loadApp({ storage: { 'opt/state-v1': JSON.stringify({ theme: 'dark' }) } });
    assert.equal(window.document.documentElement.dataset.theme, 'dark');
  });
  test('localStorage 存了壞 JSON 也不會讓載入失敗（loadState 有 try/catch）', () => {
    assert.doesNotThrow(() => loadApp({ storage: { 'opt/state-v1': '{bad json' } }));
  });
  test('esc() 跳脫 HTML 特殊字元', () => {
    const { esc } = loadApp().api;
    assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  });
});
