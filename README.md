# BV-Note v3.0.4

保留原本文件編輯頁面 UI；共用 Explorer 切換獨立雲端頁面。

## v3.0.4 修改
- 移除一般使用者雲端頁面的 Cloud API URL 欄位與連線按鈕。
- 網站部署者在 `cloud-config.js` 預先設定 Worker HTTPS URL。
- 一般使用者只需要完整 File Hash ID 搜尋並操作雲端文件。
- 本地 Explorer 和雲端服務保持隔離，沒有修改 Worker 資料庫 schema 或權限模型。
- 沿用 v3.0.2 的 File Hash ID 持有即有讀寫刪除權限規則，風險請見部署說明。

請先閱讀 `DEPLOY_V3_STEP_BY_STEP.md`，再部署網站。

## v3.0.4 雲端「其它功能」選單

雲端右上角「其它功能」採用與編輯頁面「設定」相同的浮動下拉選單樣式及定位機制，點擊外部、Escape 或切換頁面時關閉。原有導入及 ZIP 下載操作保留；本地 Explorer 不變。
