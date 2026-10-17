# A34 — ScrollableTable

- AreaID：`A34`
- Version：`2.4.3`
- Description：寬 Markdown 表格水平捲動
- Input：HTML table、容器寬度
- Output：可水平捲動表格
- FileCodeID：`F5`
- CodePath：`Source/style.css`
- CodeLocator：`#editor table overflow-x rules`
- FileSHA256：`4d3f54ffbac64e69f9315d687c86187f86b8e1037a1c47296427257486c0ff59`

## BUS 與控制規則

資料來源、驗證及權限以對應 Source 程式碼為準；此文件是靜態架構紀錄，不宣稱已有完整執行期 BUS 驗證與錯誤日誌。

## 程式碼引用

`Code/REFERENCE.md` 指向 `../../Source/style.css`；Source 為唯一權威快照。

## Flow

`MarkdownTable → HTMLTable → CSS overflow-x:auto → HorizontalScroll`
