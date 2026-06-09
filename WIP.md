# WIP — OPT · 衍生品自學系統

最後更新：2026-06-09（台北時間）/ Codex（學習閉環補強：交易前 Gate + No-Trade Drill + Journal Coach）

## 現在狀態

- **全部 36 章現在都「完成」到手冊自訂標準，並補上交易前 / 交易後學習閉環**。
- 本輪補強：
  1. **Ch27 StrategyPicker 從 3 維度擴成 5 步**：原本「持倉 / 方向 / IV」保留為核心決策表，新增「近期事件」與「期權鏈流動性」gate；結果頁會在財報/FOMC/點差過寬等情境提示「先不要直接下單」。
  2. **新增 PreTradeChecklist 互動元件**：六項交易前 Go / No-Go 檢查（thesis、最大虧損、部位大小、事件、流動性、出場條件），硬性項目沒過就顯示 Gate 未通過。
  3. **新增 No-Trade Drill**：Ch27 增加 3 題「應該不交易」練習，訓練 CSP 看空、財報前 long straddle、低流動性 iron condor 等反例。
  4. **Ch36 TradeJournal 新增 Journal Coach**：根據交易紀錄提示樣本太小、勝率偏低、平均虧損過大、連虧降部位、某策略累計虧損、open 太久等檢討重點。
  5. 首頁計數更新為 **35 章 + 14 互動 + 11 案例 + 9 Quiz + 名詞表**。
- 驗證：`node` 解析 9 組 quiz JSON OK；抽出 `<script>` 後 `new Function()` JS parser OK；功能存在性檢查 OK。瀏覽器 localhost 實跑因本環境 Browser enterprise policy 擋 `127.0.0.1`，未做互動實跑。
- 2026-06-03 全章補完摘要：
  1. **10 個薄章補上 in-chapter 數字實算**：Ch9 Wheel 三輪、Ch12 四指標合議(SPY)、Ch18 方向對卻被 IV Crush 吃掉的跨式、Ch20 NT$100萬選約、Ch22 轉倉現金流、Ch24 大額交易人判讀、Ch31 VXX 事件避險(contango 損耗)、Ch34 SPX 0-DTE Iron Condor、Ch35 skew/期限結構判讀、Ch36 範例日誌。每個案例都經對抗式數字複核（break-even / 最大虧損 / roll 成本 / 槓桿 / IV crush 等重算過）。
  2. **清掉過時版本字樣**：首頁綠框（原寫 Stage 3 / 31 章 / 9 互動 / 7 Quiz → 改 35 章+實戰日誌 / 13 互動 / 8 Quiz）、Ch23 對 Ch25「規劃中/預覽版」、案例庫「Stage 1/2」、Ch29「結語（Stage 2）」、Ch35「Stage 3 完整版」、兩個 Stage 0 開發註解。
  3. **側欄徽章一致化**：移除 Ch5 殘留的「✓ 完整」，補 Ch11 ✓IVTerm、Ch12 ✓Skew、Ch16 ✓Builder、Ch21 ✓Sim。
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
