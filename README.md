## BV-Note v2.2.12 更新

- 設定選單新增「EXPLORER（開關）」：切換左側 Explorer 開啟與關閉。
- Explorer 尚無任何節點（無 Root 或空 Root）時，點擊 +Fold 與「新文件」共用相同建立流程：選擇存儲路徑、建立「新檔案」Root 與「新文件.md」、載入 Explorer。
- 已有節點時 +Fold 保留原有建立資料夾行為。

## v2.2.10
- 瀏覽模式下點選 Explorer File 即切換顯示該檔案的 Markdown 渲染內容，維持瀏覽模式。
- 修正模式切換時舊編輯框內容覆蓋新載入 Markdown 的問題。
- 編輯模式切換文件時暫存未保存內容。

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


## v2.2.7
- Explorer Operate: 批量選取、刪除、剪下、複製、貼上。
- 資料夾批量選取自動包含子項目；批量操作只處理最上層被選節點。
- 修正刪除資料夾的遞迴刪除流程。
- 剪貼簿僅限當前開啟的 Root 與目前頁面，不跨頁面保留。


## v2.2.8
- 修正 Operate 點擊後被全域 click handler 立即關閉。
- 批量選取時，對節點長按或右鍵開啟 Operate 選單。


## v2.2.9
- 開啟既有 Root 時，Explorer 中所有 Fold 預設為收合狀態，點擊 Fold 才展開；不影響檔案讀取與儲存。


## v2.2.12
- Explorer 瀏覽模式切換文件時，記住每份文件的捲動位置，切回時恢復。
- 重新選取 Root 或關閉 Root 時清除舊位置記錄。


## v2.2.14
- 目錄批量選取與批量刪除。
- 標註文字強制黃底黑字。
- 目錄與標註新增/修改/刪除使用就近的內部 UI，不使用瀏覽器 prompt。


## v2.3.1
- 移除編輯區與瀏覽區的右鍵／長按文字工具觸發。
- 在「設定」中新增「文本工具」，框選文字後由此開啟目錄化與標註。
- 保留空白標註內容。


## v2.4.0
- 目錄與標註寫入 Root 內 `.bv-note-records.json`，每個 File 獨立保存；原始 Markdown 不變。
- Explorer 只顯示資料夾、`.md`、`.txt`；其他檔案仍留在磁碟。
- 請使用支援 File System Access API 的瀏覽器並授予讀寫權限。
- 跨裝置需一併複製 Root 中的 `.bv-note-records.json`。

## v2.4.0
- 目錄與標註每次操作完成後自動保存中繼資料及當前文件。
- 設定 → 文本工具 → 插入圖片，選擇本地圖片後以 data URL 嵌入 Markdown。
- 已開啟空 Root 時，+Fold 直接建立資料夾。

### v2.4.0
- 新增 File 時，若名稱未含副檔名，預設補上 `.md`（例如 `筆記` → `筆記.md`）；已輸入 `.txt` 或 `.md` 則保留。


## v2.4.0
- Root 右鍵／長按新增「重新命名 Root」。選取 Root 的上一層資料夾授權後，完整複製所有檔案（包含隱藏中繼資料），遷移目錄與標註鍵值，刪除舊 Root。


## v2.4.0：圖片貼上與 UUID 節點識別
- 編輯模式的 Markdown 輸入框支援 Ctrl+V 貼上剪貼簿圖片，以 Data URL Markdown 插入游標處。
- 文本工具插入圖片：編輯模式使用游標位置；瀏覽模式使用框選文字所在行的下一行。
- Root 新增 `.bv-note-node-ids.json` 保存 Root、Fold、File 的 UUID。UUID 是隨機唯一識別碼，**不是文件內容的雜湊值**。
- `.bv-note-records.json` v2 以 File UUID 儲存目錄與標註，並在載入時將舊版路徑索引遷移至 UUID。
- Explorer 排序以 UUID 儲存，兼容舊版路徑排序資料。
- 使用 Explorer 重新命名、移動時保留 UUID；複製建立新的 UUID。
- 請一併備份 `.bv-note-node-ids.json` 與 `.bv-note-records.json`，否則跨裝置搬移可能無法還原目錄與標註關聯。


## v2.4.3
Root 可點選以建立子 Fold；支援編輯會話恢復、外部檔案清單定期刷新、瀏覽插圖自動保存、目錄面板直接目錄化，移除標註操作。
