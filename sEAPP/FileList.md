# FileList

路徑相對於專案根目錄；AREA 可以跨檔案。

| File Path | AREA |
|---|---|
| index.html | A17 |
| app.js | A1, A2, A3, A4, A5, A11, A14, A17 |
| renderer.js | A2, A3 |
| explorer.js | A5, A6, A7, A8, A12, A13, A15 |
| toc.js | A9, A10, A11, A17 |
| mermaid-support.js | A14 |
| style.css | A16 |

## 說明

本版僅替換架構描述文件，不新增 Snapshot／Log 執行期機制。這些屬於 sEAPP 的選用能力。

## v2.4.6 變更

- `toc.js`：A10 移除編輯／瀏覽快速定位按鈕及其回呼。
- `mermaid-support.js`：A14 加入圖表類型判斷、語法預檢及安全回退。
- `style.css`：A16 加入錯誤圖表的原碼顯示樣式。
