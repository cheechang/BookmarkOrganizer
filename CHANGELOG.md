# Changelog

All notable changes to the Bookmark Organizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.6.6] - 2026-04-23

### Fixed

- **Theme Toggle Tooltip i18n**
  - Fixed the dark mode toggle button tooltip not updating when switching languages. The `applyTheme()` function is now re-invoked on `localeChanged` events to sync the tooltip text to the current language.

- **Theme Toggle Icon Consistency**
  - Replaced emoji icons (🌙/☀️) with custom SVG line-style icons for the theme toggle button, ensuring identical visual appearance across all languages and operating systems.
  - SVG icons use the same stroke-based design as the sidebar navigation icons (`currentColor`, `stroke-width="1.5"`), with automatic light/dark theme adaptation.

---

## [1.6.5] - 2026-04-23

### Added

- **Auto-Update Check**
  - Added a "Check for Updates" button in both the popup and options page bottom toolbars.
  - One-click check compares the installed extension version against the latest release on GitHub.
  - When an update is available, a modal dialog shows the current version, latest version, and localized changelog.
  - Includes a direct "Go to Download" button to open the GitHub Release page for manual installation.
  - Full i18n support: all UI text and changelog headings are translated across 5 languages (en, zh-CN, es, ja, de).
  - Fetches remote `manifest.json` and `CHANGELOG.md` directly from the GitHub repository via the public API.

---

## [1.6.4] - 2026-04-23

### Fixed

- **Broken Links Page UI Improvements**
  - **i18n header translation for URL column**: The `labelUrl` key in Chinese (`zh_CN`) locale now correctly translates to "网址" instead of the English "URL", ensuring the table header displays properly in all supported languages.
  - **Unified text color styling**: Aligned the text colors of the Title and URL columns with Status, Status Code, Error, and Checked At fields in both the full-page table (`options.css`) and popup card layout (`popup.css`). All columns now use consistent `#2d3748` (light) / `#e0e0e0` (dark) colors.
  - **Toolbar layout and button styling**: Merged the search input into the same horizontal row as the Select All / Deselect All buttons in both options and popup views. Added proper background colors to `.btn-toolbar` buttons (`#edf2f7` in light mode, `#2d3748` in dark mode) with hover effects, ensuring visual prominence and full theme adaptability.

---

## [1.6.3] - 2026-04-23

### Added

- **Professional Extension Icons**
  - Re-designed the full set of extension icons (16×16, 48×48, 128×128) with a unified "Organized Bookmark" visual concept.
  - Icons feature a gradient background (`#667eea` → `#764ba2`), a white bookmark flag shape, list lines, and a check-mark badge—consistent with the extension theme.
  - Added `icons/generate-icons.html` for browser-based PNG export (no dependencies required).
  - Added `icons/svg-to-png.js` for Node.js / sharp batch conversion.

- **Unified Navigation Icons**
  - Replaced emoji icons in the options page sidebar with custom SVG line-style icons:
    - Scan (magnifier), Categories (folder), Duplicates (overlapping rectangles)
    - Backups (download arrow), Broken Links (broken chain), Settings (gear)
  - Added matching SVG icons to popup tab buttons for visual consistency.
  - All navigation icons use stroke-based design with `currentColor` for automatic light/dark theme adaptation.

### Fixed

- **Popup tab click handling**
  - Fixed an issue where clicking on the new SVG icons inside tab buttons would not switch tabs. Changed `e.target` to `e.currentTarget` in the event handler so the `data-tab` attribute is always read from the button element.

---

## [1.6.2] - 2026-04-23

### Fixed

- **Fixed broken links progress display bug**
  - Corrected `checkingItem` placeholder format in all 5 language files (`{0}/{1}` → `$1/$2`), ensuring progress text now correctly shows "Checking 1 / 100..." instead of "Checking {0} / {1}...".

### Added

- **Broken Links Page Enhancements**
  - **Full-text fuzzy search**: Added a search input box at the top of the broken links results page (both full-page and popup views). Supports real-time fuzzy matching against bookmark titles and URLs.
  - **Sortable column headers** (full-page view): Users can now click any table header (Title, URL, Status, Code, Error, Checked At) to sort results in ascending or descending order. Sort direction toggles on each click, with visual indicators (▲/▼) showing the current sort state.
  - **Popup sort dropdown**: Added a sort selector in the popup toolbar for compact-view sorting.
  - **User-friendly error translations**: Technical error reasons (e.g., "HTTP 404", "Connection timeout", "Network error") are now translated into plain-language descriptions in all 5 supported languages (en, zh-CN, es, ja, de). Error descriptions automatically switch when the user changes language.
  - **Header text internationalization**: All table header labels in the broken links view are now fully internationalized, replacing previously hard-coded "URL" and "Code" text.

---

## [1.6.1] - 2026-04-23

### Fixed

- **Duplicate Detection Algorithm Improved**
  - Fixed an issue where two URLs with the same domain but different query parameters (e.g., different `timestamp` values) were incorrectly detected as 100% similar duplicates.
  - The algorithm now compares both title similarity **and** URL path similarity (using normalized URLs without query strings), with a weighted average (title 60%, URL 40%).
  - Added a new **"Normalized Duplicate"** detection stage: URLs that share the same path but differ only in query parameters are now classified separately, making it easier to identify and clean up dynamic-parameter duplicates.
  - UI now distinguishes three duplicate types: **Exact Duplicate**, **Normalized Duplicate** (same path, different parameters), and **Similar Duplicate** (same domain with similar titles/paths).

---

## [1.6.0] - 2026-04-23

### Added

- **Broken Link Detection**
  - New dedicated "Broken Links" page accessible from the sidebar navigation (options) and tab bar (popup).
  - Detects unreachable bookmarks by sending HTTP requests (HEAD then GET fallback) with 10-second timeout.
  - Identifies HTTP 404/410 errors, server errors (5xx), timeouts, and network failures (DNS/connection refused).
  - Results display bookmark title, URL, status type, HTTP status code, error reason, and last checked time.
  - Batch selection with "Select All" / "Deselect All" buttons and individual checkboxes.
  - Bulk delete selected broken bookmarks with automatic backup integration (if auto-backup is enabled).
  - Concurrent request limiting (3 workers) with small delays between requests to avoid browser卡顿 and rate limiting.
  - Only `http://` and `https://` URLs are checked; special protocols (chrome://, file://, javascript:) are safely skipped.

### Changed

- **manifest.json**: Added `host_permissions` for `http://*/*` and `https://*/*` to enable cross-origin link checking.
- **options.html / popup.html**: Added Broken Links navigation item, detection button, progress bar, stats panel, results list, and toolbar.
- **options.js / popup.js**: Added `handleCheckBrokenLinks`, `displayBrokenLinks`, and `handleDeleteBrokenLinks` functions.
- **utils.js**: Added `checkSingleLink` and `checkBrokenLinks` utility functions with AbortController timeout and HEAD/GET fallback.
- **options.css / popup.css**: Added styles for broken links table, rows, status badges (broken/timeout/error), and dark mode overrides.
- **i18n**: Added 20 new translation keys across all 5 locales for Broken Links feature UI text.

---

## [1.5.0] - 2026-04-23

### Added

- **Collapsible Category Groups**
  - Each category group in the Categories page now has a fold/unfold toggle button.
  - Users can expand or collapse individual groups to focus on specific categories.
  - Added "Expand All" and "Collapse All" buttons for quick bulk control.
  - Smooth CSS transition animation when expanding or collapsing.

- **Fuzzy Full-Text Search**
  - Added a search bar above both the Categories and Duplicates lists.
  - Search matches against bookmark titles and URLs in real-time as you type.
  - Results are filtered instantly without re-scanning bookmarks.
  - Search state is preserved across language switches and re-renders.

- **Dark Mode**
  - Added a dark mode toggle button (🌙/☀️) in the header of both popup and options pages.
  - Theme preference is persisted in browser storage and survives restarts.
  - Comprehensive dark theme styling across all UI components: sidebar, cards, lists, forms, filter tags, and progress bars.
  - All 5 supported languages include translated tooltips for the theme toggle.

### Changed

- **options.html / popup.html**: Added search inputs, expand/collapse buttons, and theme toggle buttons.
- **options.js / popup.js**: Updated `displayCategories` and `displayDuplicates` to accept a `searchTerm` parameter and filter results. Added `initTheme`, `applyTheme`, and `toggleTheme` functions.
- **options.css / popup.css**: Added styles for toolbar, search inputs, category toggles, collapse animations, and extensive dark mode color overrides.
- **i18n**: Added new translation keys: `placeholderSearchBookmarks`, `btnExpandAll`, `btnCollapseAll`, `tooltipDarkMode`, `tooltipLightMode`, `emptyNoResults` across all 5 locales.

---

## [1.4.2] - 2026-04-23

### Added

- **Custom Category Rules**
  - Added a new "Custom Category Rules" section in the Settings page.
  - Users can add, edit, and delete personalized categorization rules.
  - Each rule includes: category name, matching keywords, and matching domains.
  - Keywords and domains support comma-separated input with automatic trimming.
  - Custom rules take priority over default rules during bookmark scanning.
  - Rules are persisted in `chrome.storage.local` and survive browser restarts.
  - Full i18n support: all UI text is translated in 5 languages (en, zh-CN, es, ja, de).
  - Input validation ensures a name and at least one keyword or domain is provided.

### Changed

- **background.js** now merges custom rules with default `rules/categories.json` when responding to `getCategories` requests. Custom rules are placed first so they take priority.

---

## [1.4.1] - 2026-04-23

### Changed

- **UI Simplification**
  - Removed the "Quick Mode" button (`openPopupBtn`) from the bottom of the options page sidebar.
  - Clicking the extension icon now always opens the full-featured options page directly.

### Added

- **DPI Auto-Adaptation**
  - Added CSS media queries to `options.css` and `popup.css` for automatic DPI scaling.
  - Supports common display scaling levels: 100%, 125%, 150%, and 200%+.
  - Prevents element overlap, text truncation, and layout breakage on high-DPI displays (e.g., Retina).

---

## [1.4.0] - 2026-04-23

### Added

- **Full Internationalization (i18n) Support**
  - Added support for 5 languages: English (en), Chinese Simplified (zh-CN), Spanish (es), Japanese (ja), and German (de).
  - Created `_locales/` directory with complete `messages.json` for each language.
  - Added `i18n.js` runtime translation module supporting async loading, language switching, and fallback to English.
  - Integrated language selector (`<select id="langSelector">`) in both `popup.html` and `options.html`.
  - All UI strings in `popup.js` and `options.js` now use `_t()` instead of hardcoded text.
  - Dynamic content (categories, duplicates, backups) re-renders automatically on language change via `localeChanged` event.
  - Language preference is persisted in `chrome.storage.local` and restored on next open.
  - `manifest.json` updated with `__MSG_*__` placeholders and `"default_locale": "en"` for Edge/Web Store compliance.

---

## [1.3.0] - 2026-04-23

### Added

- **Smart Default Selection for Duplicate Cleanup**
  - In the duplicate detection page, duplicate items are now pre-selected intelligently based on their location:
    - If a group contains items in the **Bookmarks Bar**, all items **outside** the Bookmarks Bar are auto-checked for deletion, preserving the copy in the Bookmarks Bar.
    - If **no** items are in the Bookmarks Bar, the first item is kept unchecked and the rest are checked.
    - If **all** items are in the Bookmarks Bar, the first item is kept unchecked and the rest are checked, ensuring at least one copy is always preserved.
  - This eliminates the need for users to manually check each duplicate item when performing bulk deletions.
  - Implemented in both `popup.js` and `options.js`.

### Fixed

- **Smart Selection Edge Case — All Duplicates in Bookmarks Bar**
  - Fixed a bug where no items would be pre-selected when an entire duplicate group was located within the Bookmarks Bar.
  - Previous logic used `some(i => i.inBookmarksBar)` which returned `true` for all-bookmarks-bar groups, but `!item.inBookmarksBar` evaluated to `false` for every item, resulting in zero selections.
  - New logic counts non-bookmarks-bar items first: if any exist, check them; otherwise fall back to keeping the first item unchecked.

- **Popup Scan Ignoring User-Configured Similarity Threshold**
  - `popup.js` was calling `detectDuplicates()` without passing the threshold, causing it to always use a hardcoded default.
  - Now correctly reads `currentSettings.similarityThreshold` and passes it to `detectDuplicates(threshold)`.

- **Stale Selection State Between Scans**
  - `selectedBookmarks` (the `Set` tracking user-selected items for categorization) was not cleared between consecutive scans.
  - This could cause items from a previous scan to remain selected in the new scan results, leading to unintended categorization operations.
  - Added `selectedBookmarks.clear()` at the start of `displayCategories`.

- **Redundant Storage Reads in Options Page**
  - `options.js` `handleFullScan` was performing an extra `chrome.storage.local.get('settings')` call even though `currentSettings` was already loaded in memory.
  - Removed the redundant read and now reuses the existing `currentSettings` object.

### Changed

- **Default Settings Enhancement**
  - Added `showPath: true` to `background.js` default settings for consistency with the UI checkbox default state.

---

## [1.2.1] - 2026-04-23

### Added

- Clicking the toolbar icon now opens the full options page directly instead of the popup.
- Tab-style filter tags in the duplicate detection page for quick group filtering.
- Tooltip on filter tags showing full bookmark title and URL on hover.
- `short_name`, `author`, and `homepage_url` fields in `manifest.json` for Edge store compatibility.
- Privacy policy (`PRIVACY_POLICY.md`) for browser extension store submission.
- Placeholder directory for screenshots (`docs/screenshots/`).

### Fixed

- Tag filter clicks not working due to CSP restrictions on inline `onclick` handlers; replaced with event delegation using `data-*` attributes and `addEventListener`.
- Bulk deletion not updating the UI in real time; fixed by filtering local `duplicates` array immediately after deletion instead of relying solely on `setTimeout` re-scan.
- Tag counts being truncated by CSS `text-overflow: ellipsis` on long titles; split title and count into separate `<span>` elements with `flex-shrink: 0` for the count.
- `similarityThreshold` default value type mismatch (`0.8` vs `80`) causing the effective threshold to be `0.008`.
- `showMessageFull()` function calls in `options.js` pointing to a non-existent function; unified to `showMessage()`.
- `clearAllBookmarks` failing to delete non-empty folders by using `remove()` instead of `removeTree()`.
- Backup list buttons using inline `onclick` (CSP violation); migrated to `data-action` attributes with event delegation.
- Outdated GitHub repository URL in `PRIVACY_POLICY.md` (`MommyBaby` → `BookmarkOrganizer`).
- Missing `showPathSetting` event binding in `options.js`; now reads, saves, and applies the setting correctly in both popup and full-page modes.

### Changed

- Modernized tag filter styles with gradients, rounded corners, shadows, and hover animations.
- Extracted common utility functions (`escapeHtml`, `loadCategories`) into `utils.js`.
- Improved `calculateGroupSimilarity` to compute the minimum pairwise similarity across all items in a group, rather than only the first two.
- Moved documentation files to `docs/` directory and cleaned up repository root structure.
- Updated `.gitignore` to exclude `.lingma/` and `nul` artifacts.

---

## [1.0.0] - 2026-04-23

### Added

- Initial release of Bookmark Organizer.
- Automatic bookmark categorization based on title, URL, and domain with customizable rules (`categories.json`).
- Duplicate detection for both exact matches (same URL) and similar matches (Levenshtein distance).
- Backup and rollback system: automatic pre-scan backups, retention of last 10 backups, manual JSON export/import.
- Dual interface: compact popup (`popup.html`) and full-page options (`options.html`).
- Multi-select mode with individual delete buttons for duplicate items.
- Settings panel for similarity threshold, auto-backup toggle, and backup interval configuration.
