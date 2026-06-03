# WIP — OPT · 衍生品自學系統

最後更新：2026-06-03 / Claude（完成所有章節：補實算 + 清過時字樣 + 徽章）

## 現在狀態

- **全部 36 章現在都「完成」到手冊自訂標準（每章皆有具體實算案例）**。本輪做了三件事：
  1. **10 個薄章補上 in-chapter 數字實算**：Ch9 Wheel 三輪、Ch12 四指標合議(SPY)、Ch18 方向對卻被 IV Crush 吃掉的跨式、Ch20 NT$100萬選約、Ch22 轉倉現金流、Ch24 大額交易人判讀、Ch31 VXX 事件避險(contango 損耗)、Ch34 SPX 0-DTE Iron Condor、Ch35 skew/期限結構判讀、Ch36 範例日誌。每個案例都經對抗式數字複核（break-even / 最大虧損 / roll 成本 / 槓桿 / IV crush 等重算過）。
  2. **清掉過時版本字樣**：首頁綠框（原寫 Stage 3 / 31 章 / 9 互動 / 7 Quiz → 改 35 章+實戰日誌 / 13 互動 / 8 Quiz）、Ch23 對 Ch25「規劃中/預覽版」、案例庫「Stage 1/2」、Ch29「結語（Stage 2）」、Ch35「Stage 3 完整版」、兩個 Stage 0 開發註解。
  3. **側欄徽章一致化**：移除 Ch5 殘留的「✓ 完整」，補 Ch11 ✓IVTerm、Ch12 ✓Skew、Ch16 ✓Builder、Ch21 ✓Sim。
- 驗證（Chrome DevTools，localhost:8765）：40 section / 全 tag 平衡、10 個實算 h2 都渲染成真元素無逸出、抽查 6 個互動元件都 hydrate、無 JS error（僅既有 PWA SVG 圖示 warning）。
- 線上：<https://people7771025.github.io/OPT/>（push 後 Pages 自動部署）

## 待確認（沿用上輪）

- **跨裝置書籤同步**仍待使用者實機確認：電腦按 📍 → ☁️ 立即同步（顯示「已同步·時間」）→ 手機**完全關分頁重開** → 看頂端是否出現相同 📂 Chx。若仍不同步查：手機端較新 ts 蓋掉、或 debounce 4s 未送出即關頁。

## 其他可選後續

- PWA 圖示換 PNG（修「加到主畫面是灰底」+ 消掉那個 manifest icon warning）。
- 英文版 / Service Worker 離線快取 / 績效連 Obsidian。
- `.stub` / `.stub-section` 那組 CSS 已無章節使用（dead code），可日後順手清掉。

## 卡點

- 無。

## 維運備忘

- 改 Worker 重部署：`wrangler deploy --config sync-worker/wrangler.toml`
- iOS 從主畫面開是 standalone 模式（無 Safari 工具列/擴充），使用者選擇維持現狀不改。
