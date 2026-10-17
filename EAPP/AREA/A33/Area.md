# A33 — InsertText

- AreaID：`A33`
- Version：`2.4.3`
- Description：於選取文字末端插入使用者文本
- Input：選取範圍、輸入字串
- Output：更新後 Markdown
- FileCodeID：`F4`
- CodePath：`Source/toc.js`
- CodeLocator：`showPopup / 插入文本事件`
- FileSHA256：`d71f745efbb8e47c84ab95eb6db27c5a4a2737faa61ce77602e3b73eb4eba2f1`

## BUS 與控制規則

資料來源、驗證及權限以對應 Source 程式碼為準；此文件是靜態架構紀錄，不宣稱已有完整執行期 BUS 驗證與錯誤日誌。

## 程式碼引用

`Code/REFERENCE.md` 指向 `../../Source/toc.js`；Source 為唯一權威快照。

## Flow

`Selection → ResolveOffset → InlineInputUI → MarkdownInsert → Render`
