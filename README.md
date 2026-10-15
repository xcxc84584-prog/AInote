# AInote v1.6 — GitHub Pages

純前端網站，將所有檔案放在 GitHub Repository 根目錄，Settings → Pages → Deploy from a branch → main / (root)。

Explorer 支援本地自動保存、FOLD 匯入匯出、樹狀結構、右鍵選單、拖曳排序。FOLD 保存是下載 .ainotefold；不會直接寫入 GitHub Repository。

注意：瀏覽器 localStorage 有容量限制；大型圖片文件請定期匯出 FOLD。不同裝置不會自動同步。拖曳排序主要適用桌面瀏覽器。


## v1.7
Explorer 左右分欄、可拖曳分隔線調整寬度、隱藏時左側 ☰ 展開、觸控螢幕從左緣右滑展開與在 Explorer 空白處左滑收合。


## v1.9 操作
- 點擊 FOLD 名稱：選取 FOLD，背景變藍；點擊箭頭：展開／收合。
- 手機長按節點約 0.55 秒：顯示右鍵功能選單；捲動時會取消長按，避免誤觸。
- 選取 FOLD 後點擊「保存」：下載選取的 FOLD（含所有子節點）至裝置本地 `.ainotefold` 檔案。未選取 FOLD 時則保存目前工作區。
- 「開啟 FOLD」可匯入先前下載的 `.ainotefold`。


## v2.0 Explorer
工具列僅保留＋資料夾、＋文件、操作、功能。右鍵及手機長按開啟操作；功能選單包含保存、刪除、關閉。節點選取高亮，重新命名為行內編輯。


## v2.2 更新
- 右上角僅保留「新文件、工具」；新文件在 Explorer 中建立並立即進入行內命名。
- FOLD 匯出為 ZIP，內含 `ainote-fold.json` 及 `files/`；可重新匯入同格式 ZIP。
- SVG Markdown data URI（含 percent-encoded、base64 與 `data\:image/svg+xml`）解析增強。
- 行動端公式水平捲動、縮放排版改善。
- ZIP 功能使用 JSZip CDN，首次使用需要網路。


## v2.3 更新
- 手機端數學公式：延遲載入 KaTeX 時，重新渲染 MathML fallback。
- Explorer FILE 右鍵／手機長按：新增保存文件、刪除文件。
- 無 FILE 或未選取 FILE 時，右側編輯器清空且停用編輯。
