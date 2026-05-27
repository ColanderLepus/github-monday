# Contribution Graph Realignment Tool

## Project Overview

Browser extension (manifest v3) that realigns GitHub's contribution graph so the week starts on Monday, not Sunday. The extension operates automatically on GitHub profile pages, moving the Sunday row to the bottom of the graph for improved chronological accuracy. Users can enable or disable the realignment feature via an options page.

## Architecture & Key Files

- `extension/manifest.json`: Declares the extension, content script, icons, permissions, options page, and Firefox compatibility settings.
- `extension/content.js`: Main logic. Uses DOM manipulation and a MutationObserver to reorder the contribution graph table. Checks user setting before applying changes.
- `extension/options/options.html` & `options.js`: Options page UI and logic for enabling/disabling realignment.
- `README.md`: Explains the mission and principles. The project is intentionally minimal and focused.

## Critical Patterns & Conventions

- **Silent Correction:** All changes are automatic unless disabled by the user.
- **User Configurability:** Users can toggle the realignment feature in the options page (`storage.sync`).
- **DOM Manipulation:** Targets `.ContributionCalendar-grid` tables. The Sunday row (index 0) is moved to the bottom, its first data cell (index 1) is deleted to realign columns, and the "Sun" label's visibility style is fixed.
- **Guard Rail:** Before making any changes, the script checks that the first row's label is "Sun". If it isn't, it skips silently — this is the idempotency mechanism (no `dataset` marker is used).
- **MutationObserver:** Observes `document.documentElement` (not `document.body`) — GitHub's Turbo navigation replaces the entire `<body>`, so observing `body` would leave the observer on a detached node.
- **SPA Navigation:** Uses the `turbo:load` event to reapply corrections after Turbo navigations. Does not use `popstate` or polling.
- **Cross-Browser Storage:** Uses `browser.storage` where available (Firefox), falling back to `chrome.storage` (Chrome/Edge).
- **No External Dependencies:** Pure JavaScript, no frameworks or libraries.

## Developer Workflows

- **Build/Test:** No build step; edit files directly. Test by loading the unpacked extension in Chrome/Edge/Firefox and visiting GitHub profiles.
- **Debugging:** Use browser DevTools to inspect the DOM and verify table manipulation. Reload the extension after changes.
- **Release:** Update `manifest.json` version, zip the `extension/` folder, and upload to the browser extension store.

## Integration Points

- **GitHub Profile Pages:** Only runs on URLs matching `https://github.com/*`.
- **Contribution Graph Table:** Script expects a 7-row `<tbody>` with the Sunday row first. If GitHub changes their DOM, update selectors and logic in `startWeekOnMonday()` in `content.js`.
- **Firefox:** Supported via `browser_specific_settings.gecko` in `manifest.json` and the `browser.storage` API fallback.

## Key Directories

- `extension/`: All source code and assets.
