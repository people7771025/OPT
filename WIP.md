# WIP — OPT · 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 4 完整版完成

## 現在狀態

- Stage 4 完整版
  - **章節 32 章**：Ch1-29 + Part Ⅷ Ch30-35 + 附錄 Ch36 實戰日誌
  - **互動元件 12 個**：PayoffDiagram · GreeksLab · StockHedgeCalc · StrategyPicker · MarginSimulator · IVTermStructure · VolSkewExplorer · PMCCBuilder · SyntheticBuilder · WheelSimulator · IVCrushAnimator · **IronCondorBuilder（新）** · **TradeJournal（新）**
  - **Quiz 7 個（覆蓋全 Part）**
  - **案例庫 11 個**
  - **學習系統強化**：
    - **章節完成標記（新）**：每章 h1 旁「☐ 標為已完成」按鈕，手動勾選
    - **學習進度 dashboard（新）**：附錄區「📊 我的學習進度」，按 Part 分組顯示完成率
    - **topbar 進度數字（新）**：「已完成 N / 36」即時顯示
    - **Glossary 搜尋（新）**：名詞表加搜尋框過濾
    - 章節已讀（自動偵測）跟章節完成（手動）視覺區分（已讀淡 ✓ / 完成綠粗 ✓）
  - **Trade Journal（新）**：網頁端下單記錄器，存 localStorage，可匯入/匯出 JSON
  - **案例修正（依 Agent 全面審查報告）**：
    - Ch15 Bull Call Spread「少賺 $1,750」→ $1,550
    - Ch32 Synthetic Long Stock $130 情境「-$1,660」→ -$1,580
    - Ch33 Risk Reversal 情境 A「+$1,620」→ +$1,970
    - Ch33 Risk Reversal 情境 C「-$1,210」→ -$1,530（加完整算式）
    - Cases ① 期貨損益方向「-$7.5k」→ +$7,500（基差收斂對 short hedger 是助力）
    - Cases ⑦ ETF 證交稅「0.3%」→ ETF 0.1%（個股才 0.3%）
    - Quiz Part Ⅵ Q3 同步修正稅率
- 本機路徑：`$HOME/Dev/OPT/`
- 線上：<https://people7771025.github.io/OPT/>

## 全面審查報告

- 22 個 case 完全正確 + Quiz 39/40 通過
- 5 個案例算術 typo（已修 4 個 + 拆解式排版 1 個未修）
- 3 個邏輯/事實問題（已全修）
- 詳見 `.audit-report.md`

## 下一步

1. 試用新功能：
   - **章節完成標記**：讀完一章點 h1 旁的「☐ 標為已完成」按鈕
   - **進度 dashboard**：sidebar 附錄區點「📊 學習進度」看總覽
   - **IronCondorBuilder**：Ch16 看 EM 推薦 strike + 勝率估算
   - **TradeJournal**：Ch36 開始記實戰下單
   - **Glossary 搜尋**：名詞表上方搜尋框
2. 後續可擴展（暫緩）：
   - LLM 助教介接
   - 多語版本（English）
   - 行動版適配優化

## 卡點

- 無

## 已知未做

- a11y form-label warning（functional 無影響）
- Cases ⑨ PMCC 權利金拆解「$450×8 + $500×3 + $540」湊不出 $5,400（實際表格加總對；中間排版錯誤）
- Cases ③ AAPL Collar A 描述「200×10」應為「100×20」（最終數字仍對）
