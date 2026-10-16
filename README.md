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


## v2.2.4
- 瀏覽紙張桌面版以 A4 近似尺寸 (794 × 1123 CSS px) 為最低高度參考，內容增加時自動增長。手機版以視窗寬度呈現，避免固定 A4 寬度造成橫向溢出。
- 修正無 Root 的「新文件」儲存：解除舊 Explorer 選取關係，Commit 與儲存均使用 Save File Picker；取消儲存時不切換瀏覽模式。
- Explorer 已選取文件時，工具列儲存及 Commit 會直接寫入對應檔案。

## v2.2.6 新文件流程
「新文件」會先選取本地父資料夾，再建立 Root 資料夾「新檔案」及子文件「新文件.md」，寫入磁碟並載入 Explorer。若名稱已存在，使用「新檔案 (2)」等名稱避免覆寫。需要支援 File System Access API 的瀏覽器（HTTPS 或 localhost）；取消選擇不會改變現有文件。
