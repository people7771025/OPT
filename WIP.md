# WIP — OPT · 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 3 + 後續修補（strike line fix + bookmark + 2 新互動）

## 現在狀態

- Stage 3 完整版 + 後續強化
  - **章節 31 章**：Ch1-29 + Part Ⅷ Ch30-35
  - **互動元件 11 個**：PayoffDiagram · GreeksLab · StockHedgeCalc · StrategyPicker · MarginSimulator · IVTermStructure · VolSkewExplorer · PMCCBuilder · SyntheticBuilder · **WheelSimulator（新）** · **IVCrushAnimator（新）**
  - **Quiz 7 個（覆蓋全 Part）**
  - **案例庫 11 個**
  - **學習體驗強化**：
    - 章節已讀追蹤（IntersectionObserver + sidebar ✓）
    - **書籤系統（新）**：topbar 📍 標記/📂 跳到，存 localStorage 含 chapterId + scrollY + timestamp
    - favicon 內嵌 SVG
  - **顯示修正**：
    - PayoffDiagram strike 加全高度虛線（原本只有底部短標籤看不到）
- 本機路徑：`$HOME/Dev/OPT/`
- 線上：<https://people7771025.github.io/OPT/>

## Obsidian 同步

- 已加 `Investing/OPT/Part-VIII-進階/_Part-VIII-總覽.md`
- 0-index.md 已加 Part Ⅷ section（Ch30-35）

## 下一步

1. 使用者試讀 + 試用：
   - **書籤功能**：讀到一半點 📍，下次打開點 📂 直接回該位置
   - **WheelSimulator**（Ch9）：換 seed 多跑幾次看路徑差異
   - **IVCrushAnimator**（Ch18）：改進場時點與實際跳幅看 Long Straddle 何時賺
   - **PayoffDiagram K 線**：現在 strike 是橙色虛線從上到下全圖
2. 後續可擴展（暫緩）：
   - LLM 助教介接
   - 績效追蹤 dashboard 連 Obsidian my-trades
   - 更多互動元件（如 IronCondorWinrate、MarginCallSimulator 細化版）

## 卡點

- 無

## 已知未做

- a11y form-label warning（functional 無影響）
- 數字示意值已加註資料來源警語
