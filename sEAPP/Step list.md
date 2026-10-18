# Step list

以下為主要操作的**邏輯流程描述**，並非經過執行期 Trace 驗證的逐函數呼叫序列。每個 Behavior 以對應起點開始，`END` 表示完成。

| Step ID | Condition | AREA | Next |
|---|---|---|---|
| S1 | B1 | A1 | END |
| S2 | B2 | A6 | S3 |
| S3 | B2 | A8 | S4 |
| S4 | B2 | A6 | END |
| S5 | B3 | A5 | S6 |
| S6 | B3 | A2 | END |
| S7 | B4 | A5 | S8 |
| S8 | B4 | A8 | END |
| S9 | B5 | A7 | S10 |
| S10 | B5 | A8 | END |
| S11 | B6 | A9 | S12 |
| S12 | B6 | A8 | END |
| S13 | B7 | A10 | S14 |
| S14 | B7 | A1 | END |
| S15 | B8 | A11 | S16 |
| S16 | B8 | A1 | END |
| S17 | B9 | A12 | S18 |
| S18 | B9 | A6 | END |
| S19 | B10 | A13 | END |
| S20 | B11 | A2 | S21 |
| S21 | B11 | A14 | END |
| S22 | B12 | A15 | S23 |
| S23 | B12 | A2 | END |
| S24 | B13 | A15 | END |

## v2.4.6 異常處理

- S21：Mermaid 語法檢查失敗時，A14 顯示可讀原碼與錯誤提示，不插入 Mermaid 錯誤 SVG。
- S22：模式切換不再由文本工具觸發快速定位；原有編輯／瀏覽切換仍保留。
