# HANDOFF — OPT · 衍生品自學系統

本機路徑 `$HOME/Dev/OPT/` · GitHub `people7771025/OPT` · Pages `https://people7771025.github.io/OPT/`

## 專案目標

把使用者已熟悉的 STK 指標語言（IV Percentile、P/C、Max Pain、基差、保證金率）連回原理與操作。
詳細計畫：`C:\Users\User\.claude\plans\warm-chasing-elephant.md`

## 設計決策摘要

| 決策 | 結論 | 理由 |
|---|---|---|
| 載體 | 單檔 self-contained HTML | 離線可開 + GitHub Pages 直接 serve + 無 build step |
| 技術 | vanilla JS + Chart.js inline | 體積夠小，足以畫 payoff / Greeks |
| 不用 | D3 / Plotly / SvelteKit | 過重或不符離線/單檔需求 |
| Math | 純 JS Black-Scholes + norm CDF | 約 80 行，無外部數學庫 |
| 主題 | light / dark / print | 深色對齊 STK：slate-900 + emerald + rose |
| 狀態 | localStorage（進度 + 主題 + 元件 input） | 跨 session 保留閱讀進度 |
| 語言 | 繁中 + 中英對照名詞 | 使用者偏好 |
| 公式 | `<details>` 摺疊，預設收起 | 白話為主，想看可展開 |

## 結構

```
OPT/
├── README.md
├── WIP.md
├── HANDOFF.md
├── index.html         # 單檔 self-contained 主檔
├── .github/workflows/pages.yml
└── .gitignore
```

Stage 1 仍維持「直接寫單檔 index.html」策略（檔案目前 ~2200 行 / ~120KB，瀏覽器處理無壓力）。
等 Stage 2 章節再翻倍 + 互動元件變複雜後再評估是否拆 src/ + build script。

## 內容架構（25 章 + 案例庫）

詳見 plan 檔，這裡只列 Stage 0 / Stage 1 / Stage 2 範圍：

- **Stage 0（原型）**：Ch5 Covered Call + 2 互動元件（PayoffDiagram + GreeksLab）✅ 完成
- **Stage 1 MVP**：14 章 + 4 互動 + 3 案例 ✅ 完成於 2026-05-21 早上
- **Stage 2 完整**：29 章 + 7 互動 + 8 案例 + 2 Quiz + 名詞表 ✅ 完成於 2026-05-21 中午
  - Ch26 套利章節依使用者要求加重操作細節
  - 3 個新互動：MarginSimulator / IVTermStructure / VolSkewExplorer
- **Stage 3 完整**：31 章（含 Part Ⅷ Ch30-35）+ 9 互動 + 11 案例 + 7 Quiz + 名詞表 ✅ 完成於 2026-05-21 下午
  - Part Ⅷ 進階主題：Ch30 LEAPS+PMCC / Ch31 VIX+VXX / Ch32 Synthetic / Ch33 Risk Reversal / Ch34 0-DTE / Ch35 Vol Surface
  - 2 個新互動：PMCCBuilder / SyntheticBuilder
  - 6 個新 Quiz / 3 個新案例 / favicon / 章節已讀自動追蹤
- **Stage 4 完整**：32 章 + 12 互動 + 11 案例 + 7 Quiz + 名詞表 ✅ 完成於 2026-05-21 傍晚
  - Ch36 TradeJournal / IronCondorBuilder / 章節完成系統 / Glossary 搜尋 / Agent 審查修案例
- **Stage 5 完整**：32 章 + 13 互動 + 11 案例 + 7 Quiz + 完整學習體驗系統 ✅ 完成於 2026-05-21 傍晚晚段
  - LearningPathBuilder：選目標+時數+經驗 → 推薦章節 + 儲存到 localStorage + sidebar highlight
  - 複習提醒系統：章節完成 7/14/30 天後自動標 🔄/🔁/⚠️ + 過期章節 h1 加「按一下重置」按鈕
  - Mobile 響應式：漢堡選單、widget stack、case scenarios 適配
  - 印刷模式：封面 + 移除互動元件 + 強制黑白
  - TradeJournal 強化：策略分組勝率、標的 Top 5、月度累計 P/L SVG 圖表、連續輸贏警示（連虧 3 次提示 Ch28 降部位規則）

## 互動元件介面（偽函式）

```js
PayoffDiagram(legs[], spot, dte)
// legs = [{side: 'call'|'put'|'stock', action: 'buy'|'sell', strike, premium, qty}]

GreeksLab(strike, dte, iv, rate, spot)
// 內部用 Black-Scholes 計算 delta/gamma/theta/vega/rho

StockHedgeCalc(holdings[], hedge_instrument)
// holdings = [{symbol, qty, beta, price}]

MarginSimulator(contract, qty, entry, current)
StrategyPicker()  // 5 step wizard
```

## 資料驅動 hydration

每個案例 / 互動元件以 `data-*` 屬性宣告，開機時 JS scan + hydrate：

```html
<div data-component="payoff"
     data-legs='[{"side":"call","action":"sell","strike":150,"premium":3.2,"qty":2}]'
     data-spot="145"></div>
```

新增案例 = 加 div，零 JS。

## 字彙 / 配色對齊基準

寫教材時要與 STK 既有指標的「字彙與判讀語言」一致：

- `C:/Users/User/Dev/STK/cf/frontend/src/lib/OptionsCard.svelte` — Ch5 / Ch10-13 字彙
- `C:/Users/User/Dev/STK/cf/frontend/src/lib/TwFuturesCard.svelte` — Ch20-24 字彙
- `C:/Users/User/Dev/STK/cf/worker/src/lib/taifex_futures.js` — Ch20-22 數值
- `C:/Users/User/Dev/STK/cf/worker/src/lib/yahoo_options.js` — Ch10/11 數學
- `C:/Users/User/Dev/STK/cf/worker/src/lib/decision_context.js` — Ch27 決策樹

## 注意事項

1. **例子的具體性 > 章節數量**：每章先把案例寫透（具體股票/價格/權利金/選擇邏輯），再進下一章
2. **內容優先於互動**：互動元件是放大內容理解，不是替代內容
3. **資料正確性**：台股期貨數字隨期交所公告變動，標註「資料截至 YYYY-MM-DD」
