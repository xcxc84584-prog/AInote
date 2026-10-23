# BV-Note 文件整理索引

本次整理僅移動文件與保守正規化程式碼排版（統一 LF 換行、去除行尾空白；部分 JSON 縮排），不進行可能改變程式行為的 JavaScript 自動重寫。

## 文件分類

- `docs/Update_History/`：版本更新紀錄、變更說明、實作狀態與版本總表。
- `docs/Deployment/`：部署與遷移指引。
- `docs/Fix_Reports/`：錯誤修正與除錯報告。
- `sEAPP/`：原有 AREA/BEHAVIOR/STEP 技術文件，保留原位置。
- `docs/` 其他資料：原位保留。

## 位置變更（原路徑 → 新路徑）

- `ai-byok-worker/DEBUG_502.md` → `docs/Fix_Reports/DEBUG_502.md`
- `BYOK_DEPLOY.md` → `docs/Deployment/BYOK_DEPLOY.md`
- `DEPLOY_GITHUB_PAGES.md` → `docs/Deployment/DEPLOY_GITHUB_PAGES.md`
- `DEPLOY_V3_1_UPDATE.md` → `docs/Deployment/DEPLOY_V3_1_UPDATE.md`
- `DEPLOY_V3_2_UPDATE.md` → `docs/Deployment/DEPLOY_V3_2_UPDATE.md`
- `DEPLOY_V3_3_SAFE.md` → `docs/Deployment/DEPLOY_V3_3_SAFE.md`
- `DEPLOY_V3_STEP_BY_STEP.md` → `docs/Deployment/DEPLOY_V3_STEP_BY_STEP.md`
- `OFFICIAL_EXPORT_GUIDE.md` → `docs/Deployment/OFFICIAL_EXPORT_GUIDE.md`
- `RESTORE_INSTRUCTIONS.md` → `docs/Deployment/RESTORE_INSTRUCTIONS.md`
- `DEPLOY_V3_5_13_AUTH.md` → `docs/Deployment/DEPLOY_V3_5_13_AUTH.md`
- `docs/Deployment_Guide.md` → `docs/Deployment/Deployment_Guide.md`
- `docs/history/CHANGELOG_V3_3.md` → `docs/Update_History/CHANGELOG_V3_3.md`
- `docs/history/CHANGELOG_V3_3_1.md` → `docs/Update_History/CHANGELOG_V3_3_1.md`
- `docs/history/CHANGELOG_V3_3_2.md` → `docs/Update_History/CHANGELOG_V3_3_2.md`
- `docs/history/CHANGELOG_V3_3_3.md` → `docs/Update_History/CHANGELOG_V3_3_3.md`
- `docs/history/CHANGELOG_V3_3_4.md` → `docs/Update_History/CHANGELOG_V3_3_4.md`
- `docs/history/CHANGELOG_V3_3_5.md` → `docs/Update_History/CHANGELOG_V3_3_5.md`
- `docs/history/CHANGELOG_V3_3_6.md` → `docs/Update_History/CHANGELOG_V3_3_6.md`
- `docs/history/CHANGELOG_V3_4_0.md` → `docs/Update_History/CHANGELOG_V3_4_0.md`
- `docs/history/CHANGELOG_V3_4_2.md` → `docs/Update_History/CHANGELOG_V3_4_2.md`
- `docs/history/CHANGELOG_V3_4_3.md` → `docs/Update_History/CHANGELOG_V3_4_3.md`
- `docs/history/CHANGELOG_V3_4_4.md` → `docs/Update_History/CHANGELOG_V3_4_4.md`
- `docs/history/CHANGELOG_V3_5_0_UI.md` → `docs/Update_History/CHANGELOG_V3_5_0_UI.md`
- `docs/history/CHANGELOG_V3_5_1.md` → `docs/Update_History/CHANGELOG_V3_5_1.md`
- `docs/history/CHANGELOG_V3_5_10.md` → `docs/Update_History/CHANGELOG_V3_5_10.md`
- `docs/history/CHANGELOG_V3_5_11.md` → `docs/Update_History/CHANGELOG_V3_5_11.md`
- `docs/history/CHANGELOG_V3_5_12.md` → `docs/Update_History/CHANGELOG_V3_5_12.md`
- `docs/history/CHANGELOG_V3_5_4.md` → `docs/Update_History/CHANGELOG_V3_5_4.md`
- `docs/history/CHANGELOG_V3_5_5.md` → `docs/Update_History/CHANGELOG_V3_5_5.md`
- `docs/history/CHANGELOG_V3_5_6.md` → `docs/Update_History/CHANGELOG_V3_5_6.md`
- `docs/history/CHANGELOG_V3_5_7.md` → `docs/Update_History/CHANGELOG_V3_5_7.md`
- `docs/history/CHANGELOG_V3_5_8.md` → `docs/Update_History/CHANGELOG_V3_5_8.md`
- `docs/history/CHANGELOG_V3_5_9.md` → `docs/Update_History/CHANGELOG_V3_5_9.md`
- `docs/history/CHANGELOG_V3_5_16_LOCAL.md` → `docs/Update_History/CHANGELOG_V3_5_16_LOCAL.md`
- `docs/history/CHANGELOG_V3_5_16.md` → `docs/Update_History/CHANGELOG_V3_5_16.md`
- `HOTFIX_DEPLOY.md` → `docs/Deployment/HOTFIX_DEPLOY.md`
- `AI_ERROR_IDS.md` → `docs/Fix_Reports/AI_ERROR_IDS.md`
- `REPORT/BV-Note_Cloudflare_Worker_Deployment(1).md` → `docs/Deployment/BV-Note_Cloudflare_Worker_Deployment(1).md`
- `V3.5.14_README.md` → `docs/Update_History/V3.5.14_README.md`
- `V3.5.15_README.md` → `docs/Update_History/V3.5.15_README.md`
- `V3.5.16_README.md` → `docs/Update_History/V3.5.16_README.md`
- `V3.5.18_UI_README.md` → `docs/Update_History/V3.5.18_UI_README.md`
- `AUTH_PBKDF2_FIX.md` → `docs/Fix_Reports/AUTH_PBKDF2_FIX.md`
- `FIX_CPU_LIMIT.md` → `docs/Fix_Reports/FIX_CPU_LIMIT.md`
- `V3.5.19_DEPLOY.md` → `docs/Deployment/V3.5.19_DEPLOY.md`
- `MIGRATION_DEPLOY.md` → `docs/Deployment/MIGRATION_DEPLOY.md`
- `V3.5.19.1_CHANGELOG.md` → `docs/Update_History/V3.5.19.1_CHANGELOG.md`
- `V3.6_GOOGLE_DEPLOY.md` → `docs/Deployment/V3.6_GOOGLE_DEPLOY.md`
- `V3.6.1_FIX_DEPLOY.md` → `docs/Deployment/V3.6.1_FIX_DEPLOY.md`
- `V3.6.2_PASSWORDLESS_DEPLOY.md` → `docs/Deployment/V3.6.2_PASSWORDLESS_DEPLOY.md`
- `V3.7.2_EXPLORER_CHANGELOG.md` → `docs/Update_History/V3.7.2_EXPLORER_CHANGELOG.md`
- `V3.7.3_MULTI_ROOT_CHANGELOG.md` → `docs/Update_History/V3.7.3_MULTI_ROOT_CHANGELOG.md`
- `V3.7.5_AI_COMPOSER_CHANGELOG.md` → `docs/Update_History/V3.7.5_AI_COMPOSER_CHANGELOG.md`
- `V3.7.6_AUTOFILL_FIX.md` → `docs/Fix_Reports/V3.7.6_AUTOFILL_FIX.md`
- `DEPLOY_V3_7_8.md` → `docs/Deployment/DEPLOY_V3_7_8.md`
- `V3.7.7_IMPLEMENTATION_STATUS.md` → `docs/Update_History/V3.7.7_IMPLEMENTATION_STATUS.md`
- `DEPLOY_V3_7_8_1_FIX.md` → `docs/Deployment/DEPLOY_V3_7_8_1_FIX.md`
- `DEPLOY_V3_7_9.md` → `docs/Deployment/DEPLOY_V3_7_9.md`
- `DEPLOY_V3_8_0.md` → `docs/Deployment/DEPLOY_V3_8_0.md`
- `DEPLOY_V3_8_1.md` → `docs/Deployment/DEPLOY_V3_8_1.md`
- `DEPLOY_V3_8_2.md` → `docs/Deployment/DEPLOY_V3_8_2.md`
- `DEPLOY_V3_8_3.md` → `docs/Deployment/DEPLOY_V3_8_3.md`
- `DEPLOY_V3_8_4.md` → `docs/Deployment/DEPLOY_V3_8_4.md`
- `DEPLOY_V3_8_5.md` → `docs/Deployment/DEPLOY_V3_8_5.md`
- `DEPLOY_V3_8_6.md` → `docs/Deployment/DEPLOY_V3_8_6.md`
- `DEPLOY_V3_8_7.md` → `docs/Deployment/DEPLOY_V3_8_7.md`
- `DEPLOY_V3_8_8.md` → `docs/Deployment/DEPLOY_V3_8_8.md`
- `DEPLOY_V3_8_9_1.md` → `docs/Deployment/DEPLOY_V3_8_9_1.md`
- `VERSION_LOG.md` → `docs/Update_History/VERSION_LOG.md`
- `DEPLOY_V3_8_9_2.md` → `docs/Deployment/DEPLOY_V3_8_9_2.md`
- `DEPLOY_V3_8_9_3.md` → `docs/Deployment/DEPLOY_V3_8_9_3.md`

## 排版正規化檔案

- `ai-byok-worker/package-lock.json`
- `backup-before-v3.2-20261019-073021/cloud-worker/package.json`
- `cloud-worker/crypto-test.js`
- `cloud-worker/console-api.js`
- `sEAPP/.bv-note-node-ids.json`
- `sEAPP/.bv-note-records.json`
- `.bv-note-node-ids.json`

## 注意

- `.git`、依賴與其他非 Markdown 資料均保留。
- 若其他文件或腳本引用了原 Markdown 相對路徑，需更新該引用。
- 未執行完整建置、部署或回歸測試。
