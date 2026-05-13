# Changelog

All notable changes to the Bookmark Organizer project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
