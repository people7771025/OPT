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
- **Stage 7 學習閉環補強**：交易前 Gate + No-Trade Drill + Journal Coach ✅ 完成於 2026-06-09
  - Ch27 StrategyPicker 由 3 維度決策表擴為 5 步 wizard：持倉 / 方向 / IV + 近期事件 + 流動性；結果頁新增 No-Go gate。
  - 新增 PreTradeChecklist 元件（`data-component="pretrade"`）：六項交易前 Go / No-Go 檢查，硬性項目沒過即顯示 Gate 未通過。
  - Ch27 新增 No-Trade Drill（3 題），訓練看空仍賣 CSP、財報前 long straddle、低流動性 iron condor 等反例。
  - Ch36 TradeJournal 新增 Journal Coach，根據交易紀錄提示樣本太小、勝率偏低、平均虧損過大、連虧降部位、策略累計虧損、open 太久等回顧重點。
  - 首頁計數同步為 35 章 + 14 互動 + 11 案例 + 9 Quiz + 名詞表。

## 全章「完成」內容補完（2026-06-03）

使用者要求「繼續完成所有章節」。先做唯讀審查（多 agent 平行逐章評分 + 全檔一致性掃描），結論：36 章都有內容、無真正空章，但
(a) 內文版本字樣停在 Stage 2/3（外框已是 Stage 6），讓人以為沒完成；(b) 約 10 章缺手冊自訂第一原則「具體 worked example（ticker/價格/權利金/strike/DTE 走一遍）」。

依使用者選的「完整補完」方案處理三類：

1. **10 薄章補 in-chapter 數字實算**（內容用對抗式工作流產生：generate → 獨立 reviewer 重算每個數字/方向/風報比，再由主執行緒逐一審閱、把 Ch9 過度冗長的「別重複算」說明精簡後才併入）：
   - Ch9 三輪 Wheel（PLTR，CSP→CC→賣股，總權利金 $350 + 資本利得 $200，年化 32%/50%）
   - Ch12 四指標合議（SPY 到期週：P/C 1.4 + skew +6pp(OTM±5%) + Max Pain $490 + OI 牆 → 箱型偏下磁吸）
   - Ch18 方向對卻被 IV Crush 吃掉的 long straddle（成本 $36、漲 $25 < EM $46、IV 80→35 → −$900）
   - Ch20 NT$100 萬選約（TX 名目 400 萬過大；MTX 1 口=足額；MXF 3–5 口微調；均 ~22x）
   - Ch22 1 口 TX 多單轉倉現金流（近月 20,100→次月 20,150，50 點×$200=NT$10,000，多單付/空單收）
   - Ch24 大額交易人判讀（淨變化 +4,000 且 OI 同步 +5,000 = 新多進場；勝率 53–56% caveat）
   - Ch31 VXX 事件避險（$5,000：情境 A 持平仍 −8% contango 損耗、情境 B VIX 18→32 賺 +$2,600）
   - Ch34 SPX 0-DTE Iron Condor（翼寬 15、收 $300、最大虧損 $1,200、BE 4987/5013、4:1 風報比、gamma 暴衝）
   - Ch35 一張期權鏈讀 skew(+9pp)/期限結構(backwardation +12pp)
   - Ch36 一筆從開倉到平倉填滿的範例日誌（NVDA CC，$3.20→$0.50 = +$270），串接勝率/損益比 heuristics
2. **過時版本字樣清乾淨**：首頁綠框（35 章+實戰日誌 / 13 互動 / 8 Quiz；2026-06-09 後為 14 互動 / 9 Quiz）、Ch23→Ch25 引用、案例庫 11 案例、Ch29/Ch35 結語、兩個 Stage 0 開發註解、Ch18「Ch26 提過」改「詳述」。（Ch32 的「Ch26 提過」是正確的，Ch26 在 Ch32 之前，保留。）
3. **側欄徽章一致化**：以「該章有具名互動工具」為準——移除 Ch5 殘留「✓ 完整」，補 Ch11 ✓IVTerm / Ch12 ✓Skew / Ch16 ✓Builder / Ch21 ✓Sim。

驗證（2026-06-03，Chrome DevTools MCP，python http.server:8765）：40 section + 全 HTML tag 平衡；10 個實算 h2 皆渲染為真元素、無 `&lt;h2&gt;` 逸出文字；抽查 wheel/skew/margin/ic/ivcrush/journal 六個元件都正常 hydrate；console 僅既有的 PWA SVG manifest icon warning，無 JS error；首頁計數確認顯示「35 章 / 13 互動」。

驗證（2026-06-09，Codex）：`node` 解析 9 組 quiz JSON OK；抽出 `<script>` 後 `new Function()` JS parser OK；功能存在性檢查 OK。瀏覽器 localhost 實跑因本環境 Browser enterprise policy 擋 `127.0.0.1`，未做互動實跑。

備註：`.stub` / `.stub-section` CSS 已無任何章節使用（dead code），保留無害，日後可順手清。

## 全站多代理健檢 + 修正（2026-06-17）

用多代理工作流（per-章 + per-元件 + 跨欄目，對抗式複核）掃完整站，修了約 35 處。

**架構相關（會影響行為，接手必讀）：**
- **頁內錨點導覽原本全壞**：`<section>` 只有 `data-chapter` 沒有 `id`，側欄 `<a href="#chN">` 與內文「見 ChXX」全部跳不動（只有鍵盤 J/K 的 `gotoChapter` 能動）。修法：`DOMContentLoaded` 開頭補 `s.id = s.dataset.chapter` + CSS `section[data-chapter]{scroll-margin-top:56px}`（topbar 49px）。原生平滑捲動 + 所有動態 `#` 連結一次修好。
- **雲端同步「改完 4 秒內關頁就漏送」根因找到並修掉**（對應舊 WIP「書籤同步待確認」）：`scheduleSync` 是 4s debounce，但沒有任何 unload/visibility flush。加 `CloudSync.flush()` + `visibilitychange(hidden)`/`pagehide` listener（initUI 註冊）+ PUT 加 `keepalive:true`。trades 合併雖是 local-wins，但日誌只有新增/刪除、無編輯，不會真的衝突，未動。
- **IVCrushAnimator 模型重寫**：原 `straddleValue` 內在/外在價值差約 100 倍量綱，預設（進場 T-7、跳幅 7%）顯示約 +2323% 假獲利，與本章「方向對也會被 IV crush 吃掉」完全相反。改成量綱一致的權利金模型（spot 正規化 100、EXPIRY=7、外在=0.8·spot·σ·√(DTE/365)、內在=|跳幅%|），EM 隨進場 IV 變動；verdict 改用真實 EM% 門檻。驗證：T-7/7%→-19% ❌、12.5%→+45% ✅、T-1/7%→-30%、T-14/7%→約打平。
- **MarginSimulator 空單觸發價位算反**：原式對多空都算成 current−D，空單應為 current+D。改 `current - Math.abs(pts)*dir`，long 跌到 19785 / short 漲到 20215。

**內容/數字（文字修正）：** ch7 Protective Put 三處「保護性買權」→「賣權」；ch20 帳戶見底 5,000 點；ch30 傳統 CC +$1,950 + LEAPS 78 delta；案例⑨ 權利金分解、案例④ −NT$24k、案例⑦ 0050 手續費 NT$7,315（連動淨損益 +NT$735 / 年化 ~0.7%，結論更保守=更誠實）+ 年化基差 +10.5%；ch14 LEAPS 槓桿方向；ch28 Kelly 成長率；ch19 期交稅當沖不減半 + 最低稅負免稅額 750 萬（已查財政部 mof.gov.tw）；ch33 IV Pctl vs skew；ch13/ch23/ch26/ch29/ch32/ch5/ch27 小修；TradeJournal 勝率分母；GreeksLab 現價標記出框；StrategyPicker/LearningPath 麵包屑顯示中文；PMCC 死碼清掉 + Delta 控制接上顯示；PayoffDiagram/IVTermStructure/GreeksLab 滑桿範圍對齊。

驗證（2026-06-17，Claude）：`new Function()` 解析整段 JS OK；9 組 quiz JSON OK；section 40/40 平衡；IVCrush/MarginSim 數值用 node 重算過。**因本機 Chrome profile 被佔用，無法做瀏覽器互動實跑**，建議手動視覺抽查（側欄捲動 / IVCrush 預設顯示虧損 / 同步關頁 flush）。

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

## 手機放大字體版面修正（2026-05-25）

使用者用 Chrome 手機「文字大小」放大後，頂端工具列比例跑掉、標題「衍生品自學系統」被壓成一字一行的直條卡左邊。

- `html` 加 `-webkit-text-size-adjust:100%; text-size-adjust:100%`：關掉 Android font-boosting 啟發式的不均勻放大（無障礙均勻放大仍有效），避免 flex 比例被搞爛
- `.topbar` 與 `.topbar .actions` 加 `flex-wrap:wrap`：字/按鈕變大時往下換行而非溢出擠壓
- `.topbar .brand` 加 `white-space:nowrap`：標題整列換行、本身不被壓成直條
- `.content` 加 `min-width:0`：修既有 bug——單欄 grid 被內部寬表格撐爆造成窄螢幕整頁可左右滑（scrollWidth 640→442）
- 驗證：Chrome DevTools MCP 模擬 ~2x 放大字，標題單行、按鈕分排、無橫向溢出；使用者回報「可以了」

### 待確認（接手請追）

跨裝置**書籤同步**效果尚未經使用者實機確認：使用者回報「兩台同步碼一致但手機看不到電腦的 📍 書籤」，當時被版面問題打斷未回報對照測試。版面修正已上線後，請使用者重測（電腦 📍→☁️立即同步→手機關分頁重開→看 📂）。若仍失效，查：手機端較新 ts bookmark 蓋掉、或 debounce 4s 未送出即關頁。

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
