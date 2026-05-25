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
- **Stage 5 完整**：學習路徑產生器 / 複習提醒 / Mobile 響應式 / 印刷模式 / TradeJournal 統計強化 ✅ 完成於 2026-05-21 傍晚晚段
- **Stage 6 完整**：LLM 助教 + PWA + 快速鍵 ✅ 完成於 2026-05-21 深夜
  - LLM 助教：自帶 Gemini API key（aistudio.google.com 取得），右下 🤖 浮動按鈕 → chat panel；系統 prompt OPT-tuned；對話自動帶當前章節 context；history 上限 30 則；回應內 [Ch5] 自動變連結
  - PWA：manifest 內嵌（data URI）+ apple-touch-icon + theme-color；可加到主畫面當 app 用（iOS Safari + Android Chrome）
  - 快速鍵：J/K 上下章 / G 首頁 / B/M 書籤 / T 主題 / / 搜尋 / ? 說明 / Esc 關閉

## 雲端跨裝置同步（2026-05-25 新增）

需求來源：使用者反映「手機網頁標記的書籤（📍），電腦網頁看不到」。
根因：所有進度存 localStorage，每裝置各自一份；Chrome 帳號同步不含網站 localStorage。

架構（使用者選 B：雲端自動同步）：

```
瀏覽器 index.html (CloudSync)  ──GET/PUT──▶  Cloudflare Worker (opt-sync)  ──▶  KV (OPT_SYNC)
   合併邏輯都在前端                          純儲存，key=blob:<同步碼>
```

- Worker repo 位置：`sync-worker/`（`wrangler.toml` + `src/index.js`）
- 部署：`wrangler deploy --config sync-worker/wrangler.toml`（帳號 libertytimelove，已登入 OAuth）
- 線上 Worker：`https://opt-sync.libertytimelove.workers.dev`，端點 `/v1/sync?code=XXXX`
  - `GET` → `{ data, ts }`（無則 data:null）
  - `PUT` body `{ data }` → `{ ok, ts }`
- KV namespace：`OPT_SYNC` id `26fb23dda7454804b81e137c844dcce9`（binding 同名）
- 同步碼：16 位英數，前端 `crypto.getRandomValues` 產生（字母去掉 0/O/1/I），同時當 ID 與密碼

設計決策：
| 項目 | 結論 | 理由 |
|---|---|---|
| 後端 | Cloudflare Worker + KV | 使用者已有 CF 帳號；免費 tier 夠；不需自架伺服器 |
| 合併位置 | 全在前端 | Worker 維持純儲存，邏輯單一處好維護 |
| 合併策略 | 不覆蓋、只聯集 | 已讀/已完成聯集、Trade Journal 依 `id` 聯集、書籤/計畫取較新 `ts`/`created` | 兩裝置都不丟資料 |
| 同步什麼 | 書籤/已讀/已完成(+ts)/學習計畫/Trade Journal | 使用者要 Journal 跨裝置 |
| 不同步 | Gemini API key（憑證）、主題/scroll（裝置偏好）、AI 對話 | 安全 / 各裝置自有偏好 |
| 觸發 | 開頁面拉一次（有變動刷新一次，sessionStorage 防迴圈）+ 改動 debounce 4s 上傳 | 體驗近「自動」又不打斷 |

安全：
- CORS 只允許 `https://people7771025.github.io` + localhost（開發）；陌生來源 403
- 同步碼必須 `^[A-Za-z0-9]{16}$`；body 上限 512KB
- 端點 URL 寫在公開 index.html 是前端必然，真正門檻是同步碼（~80 bits）
- KV id / Worker URL 非機密，可進 git；無任何 token/secret 進 repo

已知限制（v1）：
- 無帳號系統，同步碼遺失就拿不回該碼雲端資料
- union 合併下「刪除」不跨裝置傳播（要徹底清空得每台都按重置；面板「清除雲端備份」只清當下，其他裝置若仍有資料下次會再上傳）
- 同一筆 trade 在兩裝置都編輯：以最後同步的那台為準（無 per-trade updated ts）

驗證（2026-05-25，localhost:8765 + Chrome DevTools MCP）：
- 載入無 JS 錯誤；GET/PUT/壞碼 400/錯路徑 404/CORS allow+deny 全通過
- 裝置1 推送 → 雲端正確存下
- 裝置2 帶不同資料合併 → completed/trades 聯集、bookmark 取較新，無覆蓋
- 全新隔離 context 貼碼 → 自動拉下完整進度、按鈕轉「☁️ 已同步」
- 測試資料事後清空

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
