# BV-Note v3.8.7 — Cloud Root Create Fold/File

## Changes
- Cloud Root in Explorer supports `+Fold` and `+File`.
- New nodes are added beneath the selected directory, or the selected file’s parent; root selection creates top-level nodes.
- Reject duplicate sibling names, traversal names and unsafe separators.
- Save the entire updated virtual tree to IndexedDB without downloading to a local folder.
- Cloud Commit remains a separate explicit action; this change does not upload automatically.
- Preserve the prior single-file draft restriction.

## Deploy
Unzip into the existing project after backing it up. From project root:

```powershell
node --check .\explorer.js
node --check .\ui-v3518.js
git add explorer.js index.html ui-v3518.js DEPLOY_V3_8_7.md
git commit -m "BV-Note v3.8.7 cloud root create nodes"
git push origin main
```

No Worker deployment or Neon migration is needed.

## Acceptance test
1. CLOUD > Edit a ZIP into Explorer.
2. Select a directory, click +Fold, and verify it appears inside that directory.
3. Select a file, click +File, and verify it appears beside the file.
4. Click Save and reload/reopen the Cloud Root from IndexedDB; verify the new nodes persist.
5. Commit and verify the new revision contains the added paths.
6. Verify a standalone imported MD still cannot create extra nodes.

Note: This change is limited to creation. Other virtual-Root actions such as rename, move, or delete may require separate adaptation.
