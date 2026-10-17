# AREA Code Record

CodeHash 為 Source 程式檔案 SHA-256（檔案層級），並非函數獨立 Hash。

| AreaID | Version | Description | FileCodeID | CodePath | CodeHash |
|---|---|---|---|---|---|
| A1 | 2.4.3 | 讀取編輯器 Markdown；定位：`markdownFromEditor` | F1 | Source/app.js | `5eaa3e03a0868f5d9556872f0ab4dc93f188eb5e3c2e53a1826fda0992aa3cf0` |
| A2 | 2.4.3 | 開啟單一檔案；定位：`openFile` | F1 | Source/app.js | `5eaa3e03a0868f5d9556872f0ab4dc93f188eb5e3c2e53a1826fda0992aa3cf0` |
| A3 | 2.4.3 | 儲存目前文件；定位：`save` | F1 | Source/app.js | `5eaa3e03a0868f5d9556872f0ab4dc93f188eb5e3c2e53a1826fda0992aa3cf0` |
| A4 | 2.4.3 | Markdown 轉 HTML；定位：`markdownToHTML` | F2 | Source/renderer.js | `595557b7745a4607fff1e28e87fa8629a1d15748594494d4a80f76a929697244` |
| A5 | 2.4.3 | 文件內容解析；定位：`parseDocument` | F2 | Source/renderer.js | `595557b7745a4607fff1e28e87fa8629a1d15748594494d4a80f76a929697244` |
| A6 | 2.4.3 | 數學式渲染；定位：`renderMathElements` | F2 | Source/renderer.js | `595557b7745a4607fff1e28e87fa8629a1d15748594494d4a80f76a929697244` |
| A7 | 2.4.3 | SVG data URL 處理；定位：`svgDataImages` | F2 | Source/renderer.js | `595557b7745a4607fff1e28e87fa8629a1d15748594494d4a80f76a929697244` |
| A8 | 2.4.3 | 重新渲染公式；定位：`refreshMathNow` | F1 | Source/app.js | `5eaa3e03a0868f5d9556872f0ab4dc93f188eb5e3c2e53a1826fda0992aa3cf0` |
| A9 | 2.4.3 | 排程公式更新；定位：`scheduleMathRender` | F1 | Source/app.js | `5eaa3e03a0868f5d9556872f0ab4dc93f188eb5e3c2e53a1826fda0992aa3cf0` |
| A10 | 2.4.3 | 開啟 Root；定位：`openRoot` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A11 | 2.4.3 | 建立節點；定位：`create` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A12 | 2.4.3 | 重新命名節點；定位：`rename` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A13 | 2.4.3 | 移動節點；定位：`move` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A14 | 2.4.3 | 刪除節點；定位：`removeNode` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A15 | 2.4.3 | 複製節點；定位：`copyNode` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A16 | 2.4.3 | 貼上選取節點；定位：`pasteTargets` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A17 | 2.4.3 | 保存 Explorer；定位：`saveAll` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A18 | 2.4.3 | 同步外部文件狀態；定位：`syncExternal` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A19 | 2.4.3 | 儲存目錄紀錄；定位：`saveRecords` | F4 | Source/toc.js | `d71f745efbb8e47c84ab95eb6db27c5a4a2737faa61ce77602e3b73eb4eba2f1` |
| A20 | 2.4.3 | 讀取目錄紀錄；定位：`readRecords` | F4 | Source/toc.js | `d71f745efbb8e47c84ab95eb6db27c5a4a2737faa61ce77602e3b73eb4eba2f1` |
| A21 | 2.4.3 | 定位目錄；定位：`locate` | F4 | Source/toc.js | `d71f745efbb8e47c84ab95eb6db27c5a4a2737faa61ce77602e3b73eb4eba2f1` |
| A22 | 2.4.3 | 顯示目錄面板；定位：`renderPanel` | F4 | Source/toc.js | `d71f745efbb8e47c84ab95eb6db27c5a4a2737faa61ce77602e3b73eb4eba2f1` |
| A23 | 2.4.3 | 插入圖片；定位：`insertSelectedImage` | F4 | Source/toc.js | `d71f745efbb8e47c84ab95eb6db27c5a4a2737faa61ce77602e3b73eb4eba2f1` |
| A24 | 2.4.3 | 視覺編輯同步原始文本；定位：`updateRawFromVisual` | F1 | Source/app.js | `5eaa3e03a0868f5d9556872f0ab4dc93f188eb5e3c2e53a1826fda0992aa3cf0` |
| A25 | 2.4.3 | 選取文件節點；定位：`choose` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A26 | 2.4.3 | 載入節點 UUID 資料；定位：`loadNodeDB` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A27 | 2.4.3 | 載入目錄資料；定位：`loadRecordDB` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A28 | 2.4.3 | 切換編輯瀏覽模式；定位：`switchMode` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A29 | 2.4.3 | 標準化複製的數學式；定位：`normalizeCopiedMath` | F1 | Source/app.js | `5eaa3e03a0868f5d9556872f0ab4dc93f188eb5e3c2e53a1826fda0992aa3cf0` |
| A30 | 2.4.3 | 整理節點排序；定位：`normalizeOrders` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A31 | 2.4.3 | Explorer 本地文件導入；定位：`importFiles / importPicker change listener` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A32 | 2.4.3 | Explorer File/Fold/Root ZIP 導出；定位：`exportNode / makeZip / zipCRC` | F3 | Source/explorer.js | `732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488` |
| A33 | 2.4.3 | 於選取文字末端插入使用者文本；定位：`showPopup / 插入文本事件` | F4 | Source/toc.js | `d71f745efbb8e47c84ab95eb6db27c5a4a2737faa61ce77602e3b73eb4eba2f1` |
| A34 | 2.4.3 | 寬 Markdown 表格水平捲動；定位：`#editor table overflow-x rules` | F5 | Source/style.css | `4d3f54ffbac64e69f9315d687c86187f86b8e1037a1c47296427257486c0ff59` |
