# WIP — OPT · 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 1 MVP 完成

## 現在狀態

- Stage 1 MVP 14 章 + 4 互動 + 3 案例完整實作
  - **章節**：Ch1-8 / Ch10-12 / Ch20-23 / Ch27（共 14 章）
  - **互動元件**：PayoffDiagram · GreeksLab · StockHedgeCalc · StrategyPicker（共 4 個）
  - **案例庫**：0050 hedge / TSM Wheel / AAPL 過財報 Collar（3 綜合案例）
- 本機路徑：`$HOME/Dev/OPT/`
- 線上：<https://people7771025.github.io/OPT/>
- topbar/path-pill/footer 已更新為 Stage 1 MVP 字樣

## 下一步（等使用者試讀後決定）

1. 使用者試讀 Stage 1，重點驗：
   - Ch1-4 風格是否與 Ch5 一致
   - StockHedgeCalc 公式 + 顆粒度建議是否實用
   - StrategyPicker 5 步流程體驗
   - 3 案例的細節（特別是 Wheel 與 AAPL Collar）
2. 觀感確認後進 Stage 2：
   - 補完 Ch9 Wheel / Ch13-19 多腿與事件 / Ch24-26 進階期貨 / Ch28-29
   - 補 3 互動：MarginSimulator / IV Term Structure / Vol Skew explorer
   - 補 5+ 案例（含台股 8% 暴跌應對、SPY iron condor、財報 long straddle 反例）
   - Quiz + 名詞表索引

## 卡點

- 無

## 已知未做

- 沒有 favicon（線上載入會有 1 個 404，不影響功能；Stage 2 補）
- Stage 1 內所有保證金/IV/權利金數字為示意值，已加註「資料截至 YYYY-MM-DD」與期交所連結提醒
- Ch10 GreeksLab 公式選讀目前 Black-Scholes 不含股息（與 STK yahoo_options 一致），影響 ITM call early exercise 計算的精度（&lt; 1%）
