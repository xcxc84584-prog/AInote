# BV-Note v3.5.0 UI Prototype

- Added AI entry button to normal Explorer.
- Added isolated AI-Explorer sidebar and AI Chat Manager page.
- Added top-right AI function buttons (Load Chat, Save Chat, Download Chat, Sync) as non-functional placeholders.
- Added sidebar close/open buttons and BACK buttons in sidebar and top-right toolbar.
- Preserved original normal editor DOM and application state while switching modes.
- No network requests, import, sync, or chat parsing is implemented in this release.

## Manual acceptance
1. Open index.html with a local HTTP server.
2. Click AI in normal Explorer. AI page appears.
3. Close AI-Explorer with X; reopen with header or page menu button.
4. Click BACK from header and sidebar separately. Normal editor is restored.
5. Confirm Markdown content remains after switching modes.
6. Confirm existing Explorer, cloud and editor controls still work in normal mode.
