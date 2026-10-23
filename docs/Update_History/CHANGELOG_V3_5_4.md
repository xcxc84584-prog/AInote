# BV-Note v3.5.4 — AI Block Math Fix

- AI Block readonly preview now calls the same `renderLooseMath()` pipeline used by normal editor.
- Inline `$...$` and display `$$...$$` are handled alongside existing protected math nodes.
- No changes to Connector, editing, saving, or original Markdown data.
- Test: import BVNote_LoadChat_Test.md; verify `$1+2$`, `$3$`, fenced code, Edit/Commit toggles.
- Browser end-to-end test pending.
