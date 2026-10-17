# A32 — ExportZIP

- AreaID：`A32`
- Version：`2.4.3`
- Description：Explorer File/Fold/Root ZIP 導出
- Input：所選節點與檔案內容
- Output：ZIP Blob 下載
- FileCodeID：`F3`
- CodePath：`Source/explorer.js`
- CodeLocator：`exportNode / makeZip / zipCRC`
- FileSHA256：`732ccc81e1f8ca77ea4283709e1ca13e4fac969eda9eb54fa49ed014a9b7e488`

## BUS 與控制規則

資料來源、驗證及權限以對應 Source 程式碼為準；此文件是靜態架構紀錄，不宣稱已有完整執行期 BUS 驗證與錯誤日誌。

## 程式碼引用

`Code/REFERENCE.md` 指向 `../../Source/explorer.js`；Source 為唯一權威快照。

## Flow

`SelectedNode → RecursiveRead → CRC32 → ZIP(STORE) → BrowserDownload`
