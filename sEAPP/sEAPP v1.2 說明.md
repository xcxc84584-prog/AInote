# sEAPP v1.2｜協議與歷史相容說明

此文件為**補充說明**，四份核心文件仍是 AREA list、Behavior list、Step list、FileList。

## 1. 定義

- AREA：單一明確功能模組，有唯一 A 編號、輸入、輸出及功能描述；可跨多個程式碼文件。
- Behavior：Condition → Action，以 B 編號描述條件及預期行為；不負責執行順序。
- Step：Condition → AREA → NextStep，以 S 編號定義條件、調用的 AREA、後續步驟或 END。多條件使用 `|`（OR）、`&`（AND）及括號。
- FileList：程式碼文件相對路徑與 AREA ID 對應，不是流程圖。
- Snapshot：AREA 間資料傳遞可選擇保留快照，應有 SnapshotID、TraceID、StepID、SourceAREA、TargetAREA、Timestamp、Payload、PayloadHash；敏感資料需遮罩。
- Log：執行紀錄應有 EventID、TraceID、Timestamp、StepID、SourceAREA、TargetAREA、SnapshotID、Status、ErrorID、DurationMS 等欄位，宜追加式記錄。
- Trace：以 ErrorID → Log → TraceID → StepID → AREA → FileList → Code File 排查錯誤。

## 2. 舊版與新版差異

- v2.4.x：原始 Markdown、編輯／瀏覽、Explorer、TOC、數學式、SVG、Mermaid、ZIP 等本地功能。
- v3.0：新增雲端頁面、Cloudflare Worker、Neon、搜尋／Commit／版本歷史／下載與導入；本地與雲端隔離。
- v3.0.1：兩頁工具列各自只顯示一個 Commit。
- v3.0.3：移除個人 Token；以 File Hash ID 作為可讀／寫／刪除的能力憑證，取消全站列表及名稱搜尋；新增永久刪除文件 API。

## 3. 既有 AREA 補完的依據

舊版 sEAPP 文件以 A1–A17 合併為 LegacyEditorAndExplorer，未列出個別 AREA 名稱。v3.0.3 對照目前實際檔案，把這 17 個 ID 細分為可讀的模組；這是**本次重新建檔的分類**，不是已驗證的舊版歷史名稱。不可用它推斷舊版原作者的 AREA ID 意義。

## 4. sEAPP 一致性

- AREA list 的 ID 必須唯一；Behavior list、Step list 亦同。
- Step 引用的 AREA 必須存在；FileList 引用的 AREA 必須存在且路徑存在。
- 變更程式碼後同步更新四份核心文件；未實作的功能不得寫成已完成。
- Cloud Worker 的 console Log 不是完整持久化 Trace；目前尚未實作每次傳遞的 Snapshot 儲存。這是未完成能力，不能宣稱已有完整 Log/Snapshot。

## 5. File Hash ID 安全風險

- UUID 為不可猜測的能力 ID，不是帳號或多因素認證；任何持有者均可永久刪除。
- UUID 洩漏後無法撤銷特定人權限；要阻止舊 ID 必須另行設計輪替或搬遷機制（本版未實作）。
- CORS 限制僅約束一般瀏覽器跨來源請求，不能阻止 curl 或其他直接 HTTP 呼叫。
- 避免將 ID 放進公開網頁、公開 Git 儲存庫或無保護的日誌。
