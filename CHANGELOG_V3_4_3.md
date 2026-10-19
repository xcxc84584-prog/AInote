# BV-Note v3.4.3

- 雲端下載 ZIP 時於 ZIP 根目錄加入 `filehashid.txt`。
- 記錄雲端 File Hash ID、版本、有效期限、原始 ZIP SHA-256 與每個檔案的 SHA-256。
- 沿用原有 `file_hash_id` 欄位，與既有 Commit 讀取流程相容。
- 檢查 ZIP CRC，若 ZIP 根目錄已含 `filehashid.txt` 則中止，避免覆蓋。
- 本地下載流程不變；雲端上傳時仍不把 `filehashid.txt` 打包到遠端。
- 不修改 Worker/資料庫；需要線上瀏覽器測試下載及重新 Commit。
