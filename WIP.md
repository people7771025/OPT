# WIP — OPT · 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 3 完整版完成

## 現在狀態

- Stage 3 完整版完成
  - **章節 31 章**：Ch1-29（Stage 2）+ Ch30-35（Stage 3 新增 Part Ⅷ）
  - **互動元件 9 個**：PayoffDiagram · GreeksLab · StockHedgeCalc · StrategyPicker · MarginSimulator · IVTermStructure · VolSkewExplorer · **PMCCBuilder（新）** · **SyntheticBuilder（新）**
  - **Quiz 7 個（覆蓋全 Part）**：Part Ⅰ-Ⅷ + Part Ⅵ 套利各一個
  - **案例庫 11 個**：含 NVDA PMCC 1 年週期、2024 VIX 飆升避險、Synthetic Long Stock 替代 IRA（新 3 案例）
  - **UI 強化**：favicon 內嵌 SVG（解決 404）、章節已讀追蹤（IntersectionObserver + localStorage、sidebar 顯示 ✓）
- 本機路徑：`$HOME/Dev/OPT/`
- 線上：<https://people7771025.github.io/OPT/>
- topbar/path-pill/footer 已更新為 Stage 3 完整版字樣

## Obsidian 同步

- 已加 `Investing/OPT/Part-VIII-進階/_Part-VIII-總覽.md`
- 0-index.md 已加 Part Ⅷ section（Ch30-35）

## 下一步（等使用者試讀後決定）

1. 使用者試讀重點：
   - Ch30 PMCC 是否符合需求（含 PMCC Builder 試算）
   - Ch31 VIX/VXX 警告是否清楚
   - Ch32 Synthetic Positions 與 SyntheticBuilder 是否好用
   - Ch33 Risk Reversal vs Jade Lizard 概念是否清楚
   - Ch34 0-DTE 警告是否充分
   - Ch35 Vol Surface + 高階 Greeks 簡介是否好讀
   - 7 個 Quiz 題目品質與解析深度
   - 章節 ✓ 已讀標記是否符合預期
2. 若有 typo / 字彙 / 公式錯誤回報後即時修正
3. 暫時可看的進一步擴展（如有興趣）：
   - 介接 LLM 助教（先前暫緩）
   - 績效追蹤 dashboard 連 Obsidian my-trades
   - 多語版本（英文）

## 卡點

- 無

## 已知未做

- 已知保證金 / IV / 權利金數字為示意值，全部已加註資料來源與「以官方為準」警語
- Black-Scholes 不含股息（與 STK yahoo_options 一致），影響 ITM call early exercise 精度 < 1%
