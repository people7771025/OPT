# WIP — OPT · 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 2 完整版完成

## 現在狀態

- Stage 2 完整版完成
  - **章節**：Ch1-Ch29 全 29 章完整實作（無 stub）
  - **互動元件 7 個**：PayoffDiagram · GreeksLab · StockHedgeCalc · StrategyPicker · MarginSimulator · IVTermStructure · VolSkewExplorer
  - **Quiz 2 個**：Part Ⅰ 基礎（5 題）/ Part Ⅳ 中級（5 題），含解析
  - **案例庫 8 個**：0050 hedge / TSM Wheel / AAPL Collar / 台股 8% 暴跌 / SPY iron condor 5M / NVDA 財報 straddle 反例 / 期現套利實戰 / Wheel 卡住對策
  - **名詞表**：5 個分類（基礎 / 策略 / Greeks 與指標 / 台股期貨 / 套利進階）含章節索引
- 重點補完：使用者特別要求的「**純套利操作方式**」已在 <a href="#ch26">Ch26</a> 完整實作（5 種型態 + 可行性評分 + 實際下單流程 + 散戶 5 鐵則）
- 本機路徑：`$HOME/Dev/OPT/`
- 線上：<https://people7771025.github.io/OPT/>
- topbar/path-pill/footer 已更新為 Stage 2 完整版字樣

## 下一步（等使用者試讀後決定）

1. 使用者試讀重點：
   - Ch1 套利補強 + Ch26 完整套利章是否解答「我想了解操作」的疑問
   - MarginSimulator / IVTermStructure / VolSkewExplorer 三個新互動是否好用
   - 5 個新案例的細節（特別是期現套利實戰、Wheel 卡住對策）
   - 2 個 Quiz 的題目品質與解析深度
2. 若有 typo / 字彙 / 公式錯誤回報後即時修正
3. 若需要更多互動 / 案例可進 Stage 3：補 0-DTE 章、Synthetic Position lab、Beta hedging 動態 rebalance simulator

## 卡點

- 無

## 已知未做

- 沒有 favicon（線上載入會有 1 個 404，不影響功能）
- Stage 2 所有保證金 / IV / 權利金數字為示意值，已加註資料來源與「以期交所/券商公告為準」警語
- Ch10 GreeksLab Black-Scholes 不含股息（與 STK yahoo_options 一致），影響 ITM call early exercise 計算精度 < 1%
