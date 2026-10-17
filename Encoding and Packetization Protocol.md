# EAPP v2.1｜Encoding and Packetization Protocol
# 編碼與封包化協議

## 1. 協議目的

EAPP 是一套用於軟體架構可視化、功能模組化、程式碼定位、執行流程追蹤及版本管理的協議。

核心目標：

1. 讓 AI 生成的程式碼具備可視化架構。
2. 讓每項使用者行為可以追蹤至實際程式碼。
3. 允許使用者自訂所有功能模組。
4. 使用 Markdown 表格記錄功能及執行順序。
5. 使用 ID 建立模組、檔案與版本之間的關聯。
6. 保留每次程式碼修改的歷史紀錄。
7. 透過封包化實現程式碼的儲存、交換與重建。

---

## 2. 核心元件定義

### 2.1 AREA

AREA 是實現一項完整功能的獨立模組。

規則：

- 每個 AREA 必須具有唯一的 AreaID。
- 每個 AREA 必須具有明確的功能說明。
- 每個 AREA 必須定義輸入及輸出。
- AREA 的內部實作不得被其他 AREA 直接修改。
- AREA 可以透過 BUS 呼叫其他 AREA。
- AREA 必須能夠定位至實際程式碼。
- AREA 必須具有版本資訊。
- AREA 的修改必須留下紀錄。

### 2.2 BEHAVIOR

BEHAVIOR 是使用者可以觸發、觀察或操作的功能行為。

例如：

- 開啟文件
- 貼上文字
- 儲存文件
- 解析 Markdown
- 匯出文件

規則：

- 每個 BEHAVIOR 必須具有唯一 BehaviorID。
- 每個 BEHAVIOR 必須具有名稱及功能說明。
- 一個 BEHAVIOR 可以包含多個 STEP。
- 一個 BEHAVIOR 可以使用多個 AREA。
- 不同 BEHAVIOR 可以重複使用同一個 AREA。
- 每個 BEHAVIOR 必須在 Behavior/Step 表格中記錄。

### 2.3 STEP

STEP 是 BEHAVIOR 的執行步驟。

規則：

- STEP 使用正整數表示執行順序。
- STEP 從 1 開始編號。
- 每個 STEP 必須對應一個 AREA，或明確定義的控制操作。
- 同一 AREA 可以在不同 STEP 重複出現。
- STEP 的順序代表預設執行順序。
- 平行、分支及迴圈執行必須另外定義。
- 不得使用 STEP 編號取代 AREA ID。

### 2.4 BUS

BUS 是 AREA 之間的資料傳輸介面。

規則：

- BUS 必須定義資料來源及目的地。
- BUS 必須定義傳輸資料的格式。
- BUS 必須確保資料完整性。
- BUS 必須依照權限限制資料存取。
- BUS 不得在未經定義的情況下修改資料。
- BUS 傳輸失敗必須產生錯誤紀錄。

### 2.5 FILECODE

FILECODE 用於建立程式檔案與 AREA 的對應關係。

規則：

- 每個 FILECODE 必須具有唯一 FileCodeID。
- 一個 FILECODE 可以包含多個 AREA。
- 一個 AREA 可以對應多個程式檔案。
- FILECODE 必須記錄實際檔案路徑。
- 檔案修改後必須更新相關紀錄。

---

## 3. Behavior/Step Markdown 表格規範

### 3.1 文件名稱

`Behavior_Step.md`

此文件為 EAPP 專案必要文件。

### 3.2 表格結構

表格採用 Markdown 格式。

- 第一欄：STEP
- 第二欄開始：BEHAVIOR
- 第一列：BehaviorID
- 第二列：BehaviorName
- 第三列開始：執行步驟

標準格式：

| STEP | B1 | B2 | B3 | ... |
|---|---|---|---|---|
| NAME | BehaviorName1 | BehaviorName2 | BehaviorName3 | ... |
| 1 | A1 | A2 | A3 | ... |
| 2 | A4 | A5 | A6 | ... |
| 3 | A7 | A8 | A9 | ... |
| 4 | A10 | A11 | A12 | ... |
| 5 | A13 | A14 | A15 | ... |

### 3.3 表格規則

R01. 每一欄代表一個 BEHAVIOR。

R02. 每一列代表一個 STEP。

R03. 每個 BEHAVIOR 必須具有唯一 BehaviorID。

R04. 表格中的 AREA 必須已在 AREA Record 中定義。

R05. AREA ID 使用 `A` 加上正整數，例如 A1、A2、A3。

R06. BEHAVIOR ID 使用 `B` 加上正整數，例如 B1、B2、B3。

R07. 同一個 AREA 可以出現在多個 BEHAVIOR。

R08. 同一個 AREA 可以在同一 BEHAVIOR 中重複使用。

R09. BEHAVIOR 不需要執行的 STEP 使用 `-` 表示。

R10. STEP 不得任意跳號。

R11. 表格必須能夠直接使用 Markdown Renderer 顯示。

R12. 表格必須能夠被程式解析為結構化資料。

R13. 表格中的 ID 必須與其他 EAPP 紀錄一致。

R14. 新增 BEHAVIOR 時，必須新增對應欄位。

R15. 修改 BEHAVIOR 執行順序時，必須更新表格與版本紀錄。

R16. 單一 STEP 原則上只記錄一個 AREA。多個 AREA 的平行執行應由獨立流程定義描述。

### 3.4 實際範例

| STEP | B1 | B2 | B3 | B4 |
|---|---|---|---|---|
| NAME | 貼上文字 | 開啟文件 | 儲存文件 | 預覽文件 |
| 1 | A1 | A2 | A3 | A4 |
| 2 | A5 | A1 | A6 | A5 |
| 3 | A7 | A7 | A8 | A7 |
| 4 | A9 | A9 | A10 | A9 |
| 5 | A11 | A11 | - | A11 |

說明：

- B1 依序執行 A1、A5、A7、A9、A11。
- B2 依序執行 A2、A1、A7、A9、A11。
- B3 依序執行 A3、A6、A8、A10。
- B4 依序執行 A4、A5、A7、A9、A11。

---

## 4. Behavior Record

文件名稱：

`Behavior_Record.md`

標準格式：

| BehaviorID | BehaviorName | Description | Trigger |
|---|---|---|---|
| B1 | 貼上文字 | 接收使用者貼上的文本 | Paste |
| B2 | 開啟文件 | 載入本地文件 | Open |
| B3 | 儲存文件 | 將原始資料寫入文件 | Save |
| B4 | 預覽文件 | 渲染文件內容 | Preview |

規則：

- BehaviorID 不得重複。
- BehaviorName 必須描述實際行為。
- Description 必須說明行為目的。
- Trigger 必須定義觸發條件。
- 每個 BehaviorID 必須能在 Behavior_Step.md 中找到。

---

## 5. AREA Record

文件名稱：

`Area_Record.md`

標準格式：

| AreaID | AreaName | Description | Input | Output | Version |
|---|---|---|---|---|---|
| A1 | TextInput | 接收文字 | UserText | RawText | 1.0.0 |
| A2 | FileReader | 讀取文件 | FilePath | RawText | 1.0.0 |
| A3 | SaveRequest | 接收儲存請求 | SaveEvent | SaveCommand | 1.0.0 |
| A5 | MarkdownParser | 解析 Markdown | RawText | ParsedText | 1.0.0 |
| A7 | SVGParser | 解析 SVG | ParsedText | SVGResult | 1.0.0 |
| A9 | LaTeXParser | 解析公式 | ParsedText | MathResult | 1.0.0 |
| A11 | DocumentRenderer | 渲染文件 | DocumentData | RenderedView | 1.0.0 |

規則：

- AreaID 必須唯一。
- AREA 名稱應明確表達功能。
- Input 和 Output 必須具有可驗證的資料格式。
- AREA 的版本必須與實際程式碼版本一致。
- 刪除 AREA 前必須檢查所有相關 BEHAVIOR。
- AREA ID 不得在刪除後重新分配給不同功能。

---

## 6. FileCode List

文件名稱：

`FileCode_List.md`

標準格式：

| FileCodeID | FileName | FilePath | AreaIDs |
|---|---|---|---|
| F1 | app.py | src/app.py | A1, A2 |
| F2 | parser.py | src/parser.py | A5, A7, A9 |
| F3 | renderer.py | src/renderer.py | A11 |
| F4 | storage.py | src/storage.py | A3, A6, A8, A10 |

規則：

- FileCodeID 必須唯一。
- FilePath 必須是專案內可解析的路徑。
- AreaIDs 必須使用 AREA Record 中已定義的 ID。
- 檔案移動或重新命名後必須更新紀錄。
- 一個檔案可以包含多個 AREA。
- 一個 AREA 可以分散在多個檔案，但必須完整記錄。
- 所有路徑均以專案根目錄為基準。

---

## 7. AREA Code Record

文件名稱：

`Area_Code_Record.md`

標準格式：

| AreaID | Version | Description | FileCodeID | CodePath | CodeHash |
|---|---|---|---|---|---|
| A1 | 1.0.0 | 接收文字 | F1 | src/app.py | SHA256 |
| A5 | 1.0.0 | Markdown 解析 | F2 | src/parser.py | SHA256 |
| A7 | 1.0.0 | SVG 解析 | F2 | src/parser.py | SHA256 |
| A11 | 1.0.0 | 文件渲染 | F3 | src/renderer.py | SHA256 |

規則：

- 每個 AREA 必須有程式碼定位資訊。
- CodeHash 欄位必須儲存實際計算的雜湊值，而不是演算法名稱。
- AREA 的程式碼修改後必須重新計算 Hash。
- AREA Code Record 必須與 FileCode List 保持一致。
- 修改程式碼不得直接覆蓋歷史版本紀錄。

---

## 8. Version Record

文件名稱：

`Version_Record.md`

標準格式：

| RecordID | AreaID | OldVersion | NewVersion | ChangeType | CommitID |
|---|---|---|---|---|---|
| V1 | A1 | - | 1.0.0 | CREATE | C001 |
| V2 | A5 | 1.0.0 | 1.0.1 | UPDATE | C002 |
| V3 | A7 | 1.0.0 | 1.1.0 | UPDATE | C003 |

規則：

- 每次 AREA 修改都必須建立版本紀錄。
- 舊版本不得被直接刪除。
- 版本使用 Semantic Versioning。
- CommitID 必須能定位至實際提交紀錄。
- 修改 BEHAVIOR 執行流程也必須留下版本紀錄。
- 不得將版本號作為唯一的完整性驗證依據。

---

## 9. Log Record

文件名稱：

`Log_Record.md`

標準格式：

| LogID | Timestamp | BehaviorID | Step | AreaID | Operation | Result |
|---|---|---|---|---|---|---|
| L1 | T1 | B1 | 1 | A1 | EXECUTE | SUCCESS |
| L2 | T2 | B1 | 2 | A5 | EXECUTE | SUCCESS |
| L3 | T3 | B1 | 3 | A7 | EXECUTE | FAILED |

規則：

- 每個 Log 必須具有唯一 LogID。
- Timestamp 必須記錄實際時間。
- BehaviorID 必須對應有效 BEHAVIOR。
- STEP 必須對應 Behavior_Step.md。
- AreaID 必須對應實際執行的 AREA。
- 執行失敗必須記錄錯誤原因。
- Log 採追加式紀錄，不得直接覆蓋歷史事件。
- 不得在 Log 中明文保存密碼、Token 等敏感資料。

---

## 10. AREA 執行規則

### 10.1 基本執行流程

1. 使用者觸發 BEHAVIOR。
2. 系統取得 BehaviorID。
3. 系統讀取 Behavior_Step.md。
4. 系統取得該 BEHAVIOR 的 STEP 順序。
5. 系統依照 STEP 定位 AREA。
6. 系統透過 AREA Record 驗證模組定義。
7. 系統透過 FileCode List 定位程式碼。
8. 系統驗證 AREA 版本與輸入資料。
9. 系統執行 AREA。
10. 系統記錄執行結果。
11. 系統繼續下一個 STEP。
12. 完成所有 STEP 後輸出結果。

### 10.2 執行失敗

當 AREA 執行失敗時：

- 必須記錄失敗的 BehaviorID。
- 必須記錄失敗的 STEP。
- 必須記錄失敗的 AreaID。
- 必須記錄錯誤代碼及原因。
- 必須根據 BEHAVIOR 定義決定重試、終止或復原。
- 不得在未定義的情況下跳過失敗 STEP。

### 10.3 執行一致性

- 同一個 BehaviorID 必須對應明確的流程版本。
- 執行開始後不得在未經控制的情況下替換 AREA。
- AREA 的輸出必須符合 Output Schema。
- 下一個 AREA 的輸入必須符合 Input Schema。
- 不相容的 AREA 不得直接連接。

---

## 11. 專案文件結構

```text
EAPP/
├── EAPP_Protocol.md
├── Behavior_Step.md
├── Behavior_Record.md
├── Area_Record.md
├── FileCode_List.md
├── Area_Code_Record.md
├── Version_Record.md
├── Log_Record.md
│
├── AREA/
│   ├── A1/
│   │   ├── Area.md
│   │   └── Code/
│   ├── A2/
│   │   ├── Area.md
│   │   └── Code/
│   └── A3/
│       ├── Area.md
│       └── Code/
│
├── Source/
│   ├── app.py
│   ├── parser.py
│   └── renderer.py
│
└── History/
    ├── Versions/
    └── Logs/
```

AREA 目錄中的 Code 可以是程式碼副本或引用資訊。若採用副本，必須定義與 Source 的同步方式及唯一權威來源。

---

## 12. 封包規則

EAPP 專案可以封裝為 ZIP。

封包必須包含：

1. EAPP 協議版本。
2. Behavior_Step.md。
3. Behavior_Record.md。
4. Area_Record.md。
5. FileCode_List.md。
6. Area_Code_Record.md。
7. Version_Record.md。
8. 所有必要的程式碼及依賴資訊。
9. 封包 Manifest 與完整性驗證資料。

Log_Record.md 可以依封包用途選擇是否包含，但其省略必須在 Manifest 中明確標示。

封包驗證必須檢查：

- 必要文件是否存在。
- ID 是否重複。
- AREA 引用是否有效。
- STEP 是否連續。
- 檔案路徑是否有效。
- 版本是否相容。
- Hash 是否一致。
- 是否存在不安全的封包路徑。

---

## 13. 協議優先順序

當不同紀錄出現衝突時，使用以下原則：

1. EAPP_Protocol.md 定義協議規則。
2. Behavior_Record.md 定義使用者行為。
3. Behavior_Step.md 定義行為與執行順序。
4. Area_Record.md 定義 AREA 的功能與介面。
5. FileCode_List.md 定義檔案對應關係。
6. Area_Code_Record.md 定義程式碼位置及版本。
7. Version_Record.md 定義修改歷史。
8. Log_Record.md 記錄實際執行結果。

上述順序用於說明文件責任，不表示高順位文件可以覆寫低順位文件中的事實。若資料不一致，驗證程序必須回報錯誤並停止受影響的操作。

---

## 14. 協議核心原則

**EAPP 的核心關係：**

`BEHAVIOR → STEP → AREA → FILECODE → CODE`

**EAPP 的追蹤關係：**

`CODE → VERSION → LOG`

**EAPP 的文件關係：**

`Behavior_Step.md → Area_Record.md → FileCode_List.md → Area_Code_Record.md`

**EAPP 的基本要求：**

任何使用者行為都必須能追蹤至執行的 AREA；任何 AREA 都必須能定位至實際程式碼；任何程式碼修改都必須能追蹤至版本與修改紀錄。

---

EAPP Protocol Version: 2.1

Document Format: Markdown

Status: Draft

