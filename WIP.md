# WIP — OPT · 衍生品自學系統

最後更新：2026-05-21 / Claude Stage 5 完整版完成

## 現在狀態

- Stage 5 完整版
  - **章節 32 章**：Ch1-29 + Part Ⅷ Ch30-35 + Ch36 實戰日誌
  - **互動元件 13 個**：原 12 + **LearningPathBuilder（新）**
  - **學習體驗強化**：
    - **學習路徑產生器**：選目標+時數+經驗 → 推薦章節+預估週數，儲存後 sidebar highlight
    - **複習提醒系統**：章節完成 7/14/30 天後自動標 🔄/🔁/⚠️
    - **行動版適配**：sidebar 變漢堡選單、widget controls 垂直 stack、tables 可滾、case scenarios 自適應
    - **印刷模式**：@media print 加封面、移除互動元件、強制黑白
- 本機路徑：`$HOME/Dev/OPT/`
- 線上：<https://people7771025.github.io/OPT/>

## 新功能位置速查

| 功能 | 位置 | 觸發 |
|---|---|---|
| 學習路徑產生器 | intro 區（首頁）| 點選 3 步驟 → 儲存計畫 |
| 漢堡選單 | topbar 左側 ☰（mobile） | 點開出 sidebar |
| 複習提醒 | sidebar nav-item 右側 icon | 章節完成超過 7/14/30 天自動顯示 |
| 「我複習過了」按鈕 | 章節 h1 旁邊（過期才顯示） | 點一下重置 timer |
| 待複習章節列表 | progress dashboard | 自動列出所有 ≥7 天的章節 |
| 印刷模式 | Ctrl+P / 列印 | 自動加封面 + 移除互動 |
| TradeJournal 策略分組 | Ch36 | 至少 1 筆已結 trade |
| TradeJournal 標的 Top 5 | Ch36 | 至少 1 筆已結 trade |
| TradeJournal 月度圖表 | Ch36 | 至少 2 個月有交易 |
| TradeJournal 連勝/連虧警示 | Ch36 | 連續 ≥ 3 筆同方向 |

## 下一步

1. 試用新功能：
   - intro 區走過 LearningPathBuilder 3 步驟、儲存計畫看 sidebar highlight
   - 手機 / 小螢幕測試 mobile 響應式
   - 印刷預覽看封面（Ctrl+P）
   - 等幾天後（或手動改 localStorage timestamp）看複習提醒
2. 後續可擴展：
   - LLM 助教介接（暫緩中）
   - 多語版本（英文）
   - PWA（讓使用者「加到主畫面」當 app）

## 卡點

- 無
