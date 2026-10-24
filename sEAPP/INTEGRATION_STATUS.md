# BV-Note sEAPP 整合狀態
- 基準：使用者提供的 v3.8.9.4 ZIP。
- GitHub：已讀取 main 的檔案樹作參照；本包不宣稱所有 GitHub 最新檔案均已同步或合併。
- 新增：/log 頁面、Cloud Worker 的失敗日誌 API、Neon migration。
- 既有 AREA：掃描原始碼現有 AREA START 標記，見 AREA_LIST_GENERATED.md。
- 尚未完成：全站 BLOCK 級別重構、所有 BEHAVIOR/CONDITION/STEP 動態關聯、完整端對端測試。
- 注意：未關聯 user_id 的 Worker 異常目前無法從一般使用者 /log 查詢；資料庫可供管理員稽核。
- 安全：不要將本 ZIP 內的 SQL 遷移略過；不得將管理金鑰、token、完整輸入內容記錄到日誌。
