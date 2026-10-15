# AInote v1.5.2

以 v1.5.1 為基礎。

- 移除編輯區連結、標題和程式碼的藍色底線。
- 停用瀏覽器拼字檢查，降低輸入時的拼字／文法標記。
- 程式碼區塊保留原始換行和縮排，使用等寬字型與橫向捲動。
- index.html 以分行格式保存，方便編輯。
- 保留原有 Markdown、SVG、圖片、表格、公式自動重新渲染及本地儲存。
- AS-CODE-P 架構文件維持中文 NODE 說明與 AREA_Summarize。

註：部分外部瀏覽器擴充功能仍可能自行插入標記。

## v2.2
Explorer Save persists move/reorder priority in Root/.bv-note-explorer-order.json; reopened Roots restore ordering.


## v2.2.1
修復設定下拉選單被 header 的 overflow-y:auto 裁切，改用 body portal + fixed 定位，支援螢幕邊界與 Escape 關閉。


## v2.2.2
- Explorer 未開啟文件時顯示空狀態提示，隱藏編輯紙張。
- Commit 寫入目前選取的本地文件，寫入成功後切換至瀏覽模式；若為獨立文件，使用原本儲存流程。
- 未儲存變更在編輯區右上角顯示 `[!] 文件未保存`，保存後消失。

## v2.2.3
- 空白編輯區提示改為兩行，新增完整 Markdown 格式提醒。
- Explorer 無節點時點擊 +Fold，改為觸發原「設定 → 開啟舊文件」的文件選擇流程，不建立資料夾。
