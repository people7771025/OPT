# WIP — OPT · 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 6 完整版

## 現在狀態

- Stage 6 完整版
  - 章節 32 章 + 互動 13 個 + 案例 11 個 + Quiz 7 個 + 名詞表
  - **新增**：
    - **LLM 助教（OPT-tuned）**：右下浮動 🤖、貼 Gemini API key 啟用、chat panel 自動帶當前章節 context、對話歷史存 localStorage（上限 30 則）、回應內 [Ch5] 自動變連結
    - **PWA**：manifest 內嵌 data URI、apple-touch-icon、theme-color、可加到主畫面
    - **快速鍵**：<kbd>J</kbd>/<kbd>K</kbd> 上下章、<kbd>G</kbd> 首頁、<kbd>B</kbd>/<kbd>M</kbd> 書籤跳/標、<kbd>T</kbd> 切主題、<kbd>/</kbd> 聚焦搜尋、<kbd>?</kbd> 說明 panel、<kbd>Esc</kbd> 關閉
- 線上：<https://people7771025.github.io/OPT/>

## LLM 助教使用流程

1. 右下角 🤖 點開
2. 第一次：貼 Gemini API key（從 https://aistudio.google.com/apikey 取得，免費 tier 即可）
3. 問題輸入後送出
4. 預設「帶入當前章節作為 context」勾選——AI 知道你正在讀哪章
5. 對話歷史保留 30 則
6. 點 ⚙️ 可重設 key、🗑 清對話、✕ 關閉

## 下一步

1. 試用 LLM 助教：
   - 取 Gemini API key https://aistudio.google.com/apikey
   - 貼進去測一個問題，例如：「Covered Call 跟 Wheel 差別」
2. 試快速鍵：開頁面後按 <kbd>?</kbd> 看所有快速鍵
3. PWA：用手機 Safari/Chrome 開線上版 → 加到主畫面，下次像 app 一樣開
4. 後續可擴展：
   - 多語版本（英文）
   - Service Worker 離線快取（要拆出 sw.js）
   - 績效追蹤連 Obsidian（手動匯出整合到 my-trades/）

## 卡點

- 無
