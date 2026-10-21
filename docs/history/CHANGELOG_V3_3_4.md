# BV-Note v3.3.4

- 本地 `#source-toggle` 為 Commit / Edit 雙模式：編輯中顯示綠色 Commit，成功儲存後切換到瀏覽模式顯示紅色 Edit；點擊 Edit 返回編輯。
- 雲端 `#cloud-commit-button` 永遠顯示綠色 Commit，不使用 Submitted 狀態，無變更時仍可再次檢查提交。
- 兩個按鈕具有獨立 DOM ID 和狀態控制，不會相互影響。
- 不變更 Worker 或資料庫。
