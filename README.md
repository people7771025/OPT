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

- **PayoffDiagram** — 損益曲線（拖履約價 / DTE 即時重畫）
- **GreeksLab** — Greeks 隨股價 / IV / 時間動態變化
- **StockHedgeCalc** — 持股組合 → 台指期避險口數試算
- **MarginSimulator** — 台指期保證金水位試算
- **StrategyPicker** — 5 step 決策樹推薦策略
- **PreTradeChecklist** — 交易前 Go / No-Go 檢查
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

## License

MIT
