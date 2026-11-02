# 美股期權 + 台股期貨自學系統

一份**離線可開、單檔 HTML**的衍生品自學手冊，覆蓋美股期權與台股期貨。
目標：把投資儀表板上熟悉的指標（IV Percentile、P/C Ratio、Max Pain、基差、保證金率）連回背後的原理與操作含義。

## 線上版

🔗 **<https://people7771025.github.io/OPT/>**

## 怎麼用

### 線上閱讀
直接打開上方 Pages 連結即可。

### 離線閱讀
1. clone 或下載 `index.html` 一個檔案
2. 雙擊開啟瀏覽器
3. 進度與設定自動保存在瀏覽器 localStorage

### 學習路徑（依需求選一條）

| 路徑 | 適合誰 | 時長 | 內容 |
|---|---|---|---|
| **快速通關** | 想理解工具不一定操作 | 6-8h | Ch1-4 + Ch10-13 + Ch20 + Ch23 + Ch27 + 2 案例 |
| **鎖股實作** | 持有現股想鎖獲利 | ~20h | + Part Ⅱ + Ch10/11/19 + 案例 2/3/4/5 |
| **完整路徑** | 系統性學習 | ~60h | 全章 + 全案例 + 進階主題 |

## 內容範圍

- **Part Ⅰ** 共通基礎：payoff diagram、權利金結構、市場存在的意義
- **Part Ⅱ** 鎖住現股獲利：Covered Call、Cash-Secured Put、Protective Put、Collar、Wheel
- **Part Ⅲ** 理解市場語言：Greeks、IV / IV Percentile、P/C、Vol Skew、Max Pain、Expected Move
- **Part Ⅳ** 多腿與事件：Vertical Spreads、Iron Condor、Straddle、財報 IV Crush
- **Part Ⅴ** 台股期貨：TX / MTX / 微台、保證金、結算、轉倉、基差、十大交易人、Beta Hedging
- **Part Ⅵ** 實戰場景案例庫（8+ 個具體案例，含台股美股混合）
- **Part Ⅶ** 決策框架、交易前 Gate、風險預算與 cheatsheet
- **Ch36** 實戰日誌：交易紀錄、策略分組、Journal Coach 檢討提示

## 互動元件

首頁宣稱的 14 個互動元件（另有 9 個 Quiz 與學習路徑產生器 LearningPathBuilder）：

- **PayoffDiagram** — 損益曲線（拖履約價 / 現價即時重畫）
- **GreeksLab** — Greeks 隨股價 / IV / 時間動態變化
- **StockHedgeCalc** — 持股組合 → 台指期避險口數試算
- **MarginSimulator** — 台指期保證金水位試算
- **StrategyPicker** — 5 step 決策樹推薦策略
- **PreTradeChecklist** — 交易前 Go / No-Go 檢查
- **IVTermStructure** — IV 期限結構與倒掛偵測
- **VolSkewExplorer** — put / call IV skew 判讀
- **WheelSimulator** — Wheel（CSP → CC）多輪模擬
- **IVCrushAnimator** — 財報前後 IV 與 Long Straddle 損益
- **IronCondorBuilder** — Iron Condor 四腿、最大損益、勝率估計
- **PMCCBuilder** — LEAPS + 短 call 與傳統 CC 比較
- **SyntheticBuilder** — 合成部位拆腿與 payoff
- **TradeJournal** — 下單紀錄、策略勝率分組、Journal Coach 檢討提示

## ⚠️ 重要聲明

- 本系統純為**學習用途**，不構成任何投資建議
- 台股期貨數值（保證金、結算日、契約規格）會隨期交所公告變動，實際交易以期交所公告為準
- 美股期權手續費、稅務規則因券商而異，實際交易以券商規定為準
- 範例中的股票價格、IV、權利金為示意數值，不代表任何時點的真實市場資料

## 開發

單檔 HTML，無 build step。直接編輯 `index.html` 即可。

未來擴充章節：依 `index.html` 內 `<section data-chapter="...">` 模板複製。
新增案例：依 `<div data-component="payoff" data-legs="...">` 資料驅動格式即可，零 JS。

## 開發者：自動化檢查

`tests/` 只用 Node 內建模組（`node:test`、`node:assert`、`node:vm`、`node:fs`），不需安裝任何套件，也不連網。
需要 Node 20 以上。在 repo 根目錄執行：

```bash
node --test
```

`node --test` 會自動找出 `tests/*.test.mjs`。只跑單一檔案時把路徑接在後面，例如 `node --test tests/pricing.test.mjs`。
Node 22 以後 `node --test tests/` 會把資料夾當成模組而失敗，請用上面兩種寫法。

| 檔案 | 保護的行為 |
|---|---|
| `tests/pricing.test.mjs` | Black-Scholes 價格與 Greeks、normCDF 精度、put-call parity、極端輸入不出現 NaN |
| `tests/ironcondor.test.mjs` | Iron Condor 最大損益、損益兩平、勝率（真正 1σ） |
| `tests/futures.test.mjs` | 台指期保證金多空觸發價、避險口數 |
| `tests/ivcrush.test.mjs` | 財報 IV crush 預設情境必須顯示虧損 |
| `tests/strategies.test.mjs` | 各 payoff 圖、PMCC、合成部位、Wheel 模擬 |
| `tests/market.test.mjs` | Vol skew、IV 期限結構、GreeksLab 顯示 |
| `tests/journal.test.mjs` | Trade Journal 統計、學習路徑時數、Quiz 計分 |
| `tests/content.test.mjs` | 錨點、section id、滑桿與數字框範圍、Quiz 資料、標籤閉合、首頁宣稱數量、無外部資源 |
| `tests/audit-examples.test.mjs` | 從內文擷取數字範例重算 |
| `tests/script-syntax.test.mjs` | 所有 inline script 與 `v2.js` 可解析 |
| `tests/v2.test.mjs` | 段落練習與間隔複習（localStorage 格式） |
| `tests/cloudsync-merge.test.mjs` | 雲端同步合併規則（聯集、不覆蓋） |

測試以 `node:vm` 在沙箱載入 `index.html` 的主腳本（假 DOM、記憶體 localStorage、`fetch` 一律丟錯），不改動 `index.html`。
標成 `todo` 的測試是已知、尚待決定的問題，不會讓整體失敗。全站數字審查結果見 `tests/AUDIT-2026-11.md`。

## License

MIT
