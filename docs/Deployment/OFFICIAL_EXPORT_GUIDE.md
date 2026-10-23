# BV-Note v3.5.6｜官方 ChatGPT 資料匯出操作指南

1. 登入 ChatGPT，開啟設定（Settings）。
2. 進入資料控制（Data Controls），選擇匯出資料（Export Data）。
3. 依畫面確認匯出申請，等待官方寄送下載連結到帳戶電子郵件。
4. 下載 ZIP，不需要解壓縮。
5. 開啟 BV-Note → AI →「匯入官方 ZIP / JSON」並選擇 ZIP，或解壓縮後選擇 `conversations.json`。
6. 匯入後聊天標題顯示在 AI-Explorer；點擊某一標題才載入聊天 Block。
7. 「Load Chat」可匯入單獨 `.md`，也會加入 Explorer 本地紀錄。

## 注意

- 匯出內容可能包含敏感個人資料；BV-Note 在本機解析，不會因匯入而自動同步雲端。
- 官方 ZIP 的結構可能改版；此版本支援 `conversations.json` 中的 mapping/current_node 與常見 messages 陣列格式。
- 同一份官方聊天再次匯入會更新同 ID 的本地紀錄；先另存重要工作副本。
- ChatGPT 分支訊息預設採 current_node 路徑；附件、圖片、工具訊息等不保證完整。
- 大型 ZIP 可能需要時間或佔用較多記憶體；本版尚未實作串流 JSON 解析。
- Save Chat 會下載 Markdown 並更新本地紀錄，不會覆寫磁碟原檔。
