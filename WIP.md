# WIP — OPT · 衍生品自學系統

最後更新：2026-05-25 / Claude（雲端同步 + 手機版面修正）

## 現在狀態

- Stage 6 完整版 + 本輪新增，均已上線：
  - **雲端跨裝置同步**：Cloudflare Worker `opt-sync.libertytimelove.workers.dev` + KV `OPT_SYNC`，前端頂部 ☁️ 按鈕。同步碼 16 位英數＝ID+密碼。同步書籤/已讀/已完成/學習計畫/Trade Journal；不同步 API key、主題。合併「不覆蓋只聯集」。`sync-worker/` 為原始碼。
  - **手機放大字版面修正**：`text-size-adjust:100%`（關掉 Android font-boosting 亂放大）＋ `.topbar`/`.actions` 加 `flex-wrap`＋`.brand` 加 `white-space:nowrap`＋`.content` 加 `min-width:0`（修既有窄螢幕橫滑）。已用 Chrome DevTools MCP 驗證。
- 線上：<https://people7771025.github.io/OPT/>（origin/main = 730c48f，前提是 WIP/HANDOFF commit 已推上）

## 待確認（本輪未收尾的唯一事項）

- **跨裝置書籤同步效果未經使用者實機確認**：使用者回報「兩台同步碼一樣，但手機看不到電腦標的 📍 書籤」，當時被版面問題打斷、未回報對照測試結果。版面已修好上線。
  - 下次請使用者測：電腦按 📍 → ☁️ 立即同步（顯示「已同步·時間」）→ 手機**完全關分頁重開** → 看頂端是否出現相同的 📂 Chx。
  - 若仍不同步要查：手機端是否有自己較新 ts 的 bookmark 蓋掉、或推送時機（debounce 4s 未送出）。

## 其他可選後續

- PWA 圖示目前是 SVG（iOS apple-touch-icon / Android manifest 都不支援），加到主畫面圖示會是通用灰底；可換 PNG（192/512 內嵌）修好。
- 英文版 / Service Worker 離線快取 / 績效連 Obsidian。

## 卡點

- 無（書籤同步屬「待使用者實機確認」，非技術卡點）。

## 維運備忘

- 改 Worker 重部署：`wrangler deploy --config sync-worker/wrangler.toml`
- iOS 從主畫面開是 standalone 模式（無 Safari 工具列/擴充），使用者選擇維持現狀不改。
