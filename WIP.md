# WIP — 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 0 原型完成

## 現在狀態

- Stage 0 原型已上線：<https://people7771025.github.io/derivatives-study/>
- Ch5 Covered Call 完整 + PayoffDiagram + GreeksLab + 章節導覽 + 深色主題 + localStorage 進度
- 本機驗證：Black-Scholes 計算正確（30 delta、theta -$0.13/天、vega $0.16/IV pp）
- 線上 HTTP 200 · Content-Length 75174 bytes（== 本機 74KB）
- HEAD：`f606fd4` 已 push 至 origin/main

## 下一步（等使用者試讀後決定）

1. 使用者試讀 Ch5 + 玩 PayoffDiagram + 玩 GreeksLab，確認文章風格、互動體驗、深色主題
2. 確認觀感後進 Stage 1 MVP：補 Ch1-4 + Ch6-8 + Ch10-12 + Ch20-23 + Ch27（共 13 章）+ StockHedgeCalc + StrategyPicker + 3 案例

## 卡點

- 無

## 已知未做

- 沒有 favicon（線上載入會有 1 個 404，不影響功能；Stage 1 可補）
