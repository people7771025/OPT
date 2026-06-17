# WIP — OPT · 衍生品自學系統

最後更新：2026-06-17（台北時間）/ Claude（全站多代理健檢 + 約 35 處修正）

## 現在狀態

- 用多代理工作流對全站（36 章 + 16 互動元件 + 跨欄目）做對抗式健檢，修了約 35 處，已 commit + push（Pages 自動部署）。
- **最重要的兩個發現（都已修）**：
  1. **頁內錨點導覽原本全壞**：側欄點章節、內文「見 ChXX」都跳不動（section 缺 id）。已補 id + scroll-margin-top，現在會平滑捲動。
  2. **雲端同步「改完 4 秒內關頁就漏送」根因找到並修掉**（就是舊「書籤同步待確認」）：debounce 沒有 flush；已加 visibilitychange/pagehide flush + keepalive。
- **修對的關鍵錯誤**：IVCrushAnimator 原本預設顯示約 +2323% 假獲利（與本章 IV crush 教訓相反）已重寫模型；MarginSimulator 空單觸發價位算反；ch7 Protective Put 三處誤譯「買權」→「賣權」；ch20/ch30/案例⑦⑨④ 數字；ch19 稅務（期交稅當沖不減半、免稅額 750 萬，已查財政部）等。
- 驗證：JS `new Function()` OK、9 quiz JSON OK、section 40/40、IVCrush/MarginSim 數值 node 重算過。**未做瀏覽器互動實跑（本機 Chrome profile 被佔用）**。
- 線上：<https://people7771025.github.io/OPT/>

## 待確認 / 建議手動抽查

- 側欄點任一章節是否平滑捲動到該章（錨點修復）。
- IVCrushAnimator 預設（進場 T-7、跳幅 7%）是否顯示「❌ 虧」而非獲利。
- 雲端同步：電腦改書籤後**馬上關分頁** → 手機重開是否看到（flush 修復）。

## 其他可選後續

- 滑桿/數字框範圍不一致：已修 PayoffDiagram/IVTermStructure/GreeksLab；WheelSim/IronCondor/MarginSim 還有幾個（widen vs tighten 方向待定，低優先）。
- (已修 2026-06-17) IronCondor 勝率原把 0.8σ 當 1σ → 改用真正 1σ（em÷0.7979）算，預設 74%→63%（誠實值）；EM 標籤也改為「預期平均移動，約 0.8σ」。
- PWA 圖示換 PNG；英文版 / Service Worker 離線快取。

## 卡點

- 無。

## 維運備忘

- 改 Worker 重部署：`wrangler deploy --config sync-worker/wrangler.toml`
- iOS 從主畫面開是 standalone 模式，使用者選擇維持現狀不改。
