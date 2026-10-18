# Step list｜BV-Note v3.0.3

Step = Condition → AREA → Next。以下含舊版編輯流程及 v3 雲端流程，S1–S27 唯一編號。

| Step ID | Condition | AREA | Next |
|---|---|---|---|
| S1 | 使用者進入編輯頁 | A7,A17,A18 | END |
| S2 | 使用者選取 Root | A8,A9,A11 | S3 |
| S3 | 已載入 Root | A9,A14 | END |
| S4 | 選取 File | A8,A9,A14,A18 | S5 |
| S5 | 已取得 Markdown | A1,A2,A3,A4,A5 | END |
| S6 | 使用者編輯 Markdown | A1,A7,A16 | S7 |
| S7 | 本地 Commit | A8,A11,A17 | END |
| S8 | 新增／更名／移動／刪除本地節點 | A10,A11,A12 | END |
| S9 | 目錄操作 | A15 | END |
| S10 | 貼上圖片 | A6,A16 | END |
| S11 | 本地 ZIP | A13 | END |
| S12 | 點 Explorer 雲端切換 | A18,A19 | END |
| S13 | 設定 API URL | A23,A34 | END |
| S14 | 建立雲端專案 & 已儲存本地文件 | A20,A21,A23,A24 | S15 |
| S15 | 雲端建立 File 初版 | A25,A26 | END |
| S16 | Search 且 UUID 合法 | A23,A27,A28 | END |
| S17 | 查看指定文件歷史 | A23,A29 | END |
| S18 | 雲端 Commit | A21,A23,A25,A26 | S19 |
| S19 | base_revision 相同 | A25,A29 | END |
| S20 | base_revision 不同 | A26,A34 | END |
| S21 | 下載指定文件或版本 | A23,A30 | END |
| S22 | 雲端導入 Explorer | A30,A31,A9 | END |
| S23 | 下載雲端 ZIP | A22,A30 | END |
| S24 | 刪除雲端文件 | A32,A23 | END |
| S25 | 任何 API 錯誤 | A34 | END |
| S26 | ID 不合法或不存在 | A27,A34 | END |
| S27 | 切換回本地編輯頁 | A18,A7,A14 | END |

## 主要執行鏈

- 本地編輯：S2 → S3 → S4 → S5 → S6 → S7。
- 雲端建立：S14 → S15。
- 搜尋：S16 → S17（選擇查看歷史時）。
- Commit：S18 → S19 或 S20。
- 刪除：S24，僅刪雲端資料。

## v3.0.3 步驟補充

| Step ID | Condition | AREA | Next |
|---|---|---|---|
| S28 | 部署時 | A23 | S29 |
| S29 | API URL 已配置 | A18, A19 | S30 |
| S30 | 使用者輸入 File Hash ID | A27, A23, A28 | END |

## v3.0.4 選單流程

| Step ID | Condition | AREA | Next |
|---|---|---|---|
| S28 | 雲端頁面點擊其它功能 | 雲端操作 UI（展開並定位選單） | S29 |
| S29 | B32 條件成立 | 雲端操作 UI（關閉選單） | END |
