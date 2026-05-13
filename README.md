# Bookmark Organizer

**English** | [中文](README.zh-CN.md) | [Español](README.es.md) | [日本語](README.ja.md) | [Deutsch](README.de.md)

Letting your browser bookmarks pile up is painful. After accumulating hundreds of them, finding anything requires searching, and your favorites bar becomes useless. This extension is designed to solve that problem.

Bookmark Organizer is a browser extension that automatically sorts messy bookmarks into categories, finds duplicates, and creates backups before any changes — so you can restore with one click if something goes wrong. All data processing happens locally on your device; nothing is uploaded to any server.

---

## What It Does

### 1. Smart Categorization
Scans all your bookmarks and automatically suggests categories based on title, URL, and domain. For example, bookmarks containing "github" or "stackoverflow" are grouped under "Development", while "bilibili" or "youtube" go under "Entertainment". Each suggestion includes a confidence score (High / Medium / Low). You can selectively apply suggestions or uncheck the ones you don't want.

Category rules are defined in `rules/categories.json`. You can add new categories or modify keywords without touching any code.

Alternatively, open the **Settings** page and use the **Custom Category Rules** section to add, edit, or delete rules directly through the UI. Rules created here are saved to browser storage and take priority over the default rules in `categories.json`.

### 2. Duplicate Detection
Finds two types of duplicates:
- **Exact duplicates** — bookmarks with the identical URL
- **Similar duplicates** — bookmarks on the same domain with highly similar titles (e.g., "React - Official Documentation" and "React Docs")

Results are displayed with filter tabs at the top. Each tab represents a duplicate group; click a tab to view only that group. You can bulk-select items for deletion or remove individual bookmarks with the 🗑 button on the right. The UI updates immediately after deletion without requiring a re-scan.

Hover over a tab to see the full bookmark title and URL for confirmation.

### 3. Backup & Rollback
Every scan automatically creates a backup of your entire bookmark tree. Backups are stored in the browser's local storage, with the most recent 10 retained and older ones auto-cleaned. If a categorization goes wrong, open the "Backup Management" page and click "Restore" to roll back.

You can also manually export backups as JSON files to your computer for easy migration or reinstallation.

### 4. Dual Interface
Click the toolbar icon to open the **full-page interface** (`options.html`). The left sidebar provides navigation across five pages: Scan, Categories, Duplicates, Backups, and Settings. The page remains open even when you click outside.

---

## Installation

### Method 1: Developer Mode (for testing or personal use)

1. Clone the repository:
   ```bash
   git clone https://github.com/cheechang/BookmarkOrganizer.git
   cd BookmarkOrganizer
   ```

2. Ensure the `icons/` directory contains PNG files in the following exact sizes:
   - `icon16.png` — 16×16
   - `icon48.png` — 48×48
   - `icon128.png` — 128×128

   If you only have an SVG, use any online converter to generate the PNGs.

3. Open your browser's extension management page (e.g., `edge://extensions/` in Edge), and enable "Developer mode" in the top-right corner.

4. Click "Load unpacked" and select the project root directory.

5. The extension icon will appear in the toolbar. Click it to start using.

### Method 2: Browser Extension Store

Submitted to Microsoft Edge Add-ons. Once approved, search for "Bookmark Organizer" to install.

---

## Usage

**Step 1: Scan**

Open the extension and click "Start Scan". The extension traverses all your bookmarks, analyzing uncategorized counts, duplicate counts, and categorized counts. A backup is automatically created before the scan.

**Step 2: Categorize**

Switch to the "Category Suggestions" page to see recommended folder structures and where each bookmark should go. Uncheck items you don't want to move, then click "Apply Selected Categories". The extension automatically creates missing folders and moves bookmarks accordingly.

**Step 3: Remove Duplicates**

Switch to the "Duplicate Detection" page. A row of tabs at the top shows each duplicate group's name and count. Click a tab to filter that group. The extension **smart-selects duplicates by default**: copies in the bookmarks bar are preserved, while duplicates outside are auto-checked for one-click cleanup. You can also manually adjust selections or delete individual bookmarks using the delete button on the right.

**Step 4: Backup Management**

The "Backup Management" page lists all historical backups, showing creation time and bookmark count. Click "Restore" to roll back, or "Delete" to free up storage space. We recommend periodically exporting important backups as local JSON files.

---

## Customizing Category Rules

### Method 1: Via Settings UI (Recommended)

Open the extension's **Settings** page, find the **Custom Category Rules** section, and click **Add Rule**. Each rule requires:

- **Category Name** — the folder name that will be created (e.g., "Work Related")
- **Match Keywords** — comma-separated words to match against bookmark titles (e.g., `work, office, meeting`)
- **Match Domains** — comma-separated domains to match against bookmark URLs (e.g., `slack.com, notion.so`)

Rules are saved automatically to browser storage and take effect immediately on the next scan. You can edit or delete rules at any time.

> **Note:** This method requires modifying the extension source files and is intended for **developers** who want to build the extension from source. Regular users should use **Method 1** above.

### Method 2: Edit `rules/categories.json` Directly

Edit the JSON file and add entries in the following format:

```json
{
  "categories": [
    {
      "name": "Your Category",
      "keywords": ["keyword1", "keyword2"],
      "domains": ["example.com", "test.org"]
    }
  ]
}
```

After modifying, reload the extension by clicking the refresh button on the extension card in the extension management page.

---

## Project Structure

| File / Directory | Description |
|---|---|
| `manifest.json` | Extension config, Manifest V3 |
| `background.js` | Service Worker; handles install events and icon clicks |
| `popup.html` / `popup.css` / `popup.js` | Popup interface (quick mode) |
| `options.html` / `options.css` / `options.js` | Full-page standalone interface |
| `utils.js` | Shared utilities: categorization engine, duplicate detection, backup logic, bookmark operations |
| `rules/categories.json` | Default categorization rules |
| `icons/` | Extension icons (16px, 48px, 128px) |
| `docs/` | Development docs and changelogs |
| `PRIVACY_POLICY.md` | Privacy policy (required for store submission) |

Core logic lives in `utils.js`:
- `analyzeBookmarks()` — scans and generates category suggestions and duplicate detection results
- `detectDuplicates()` — detects duplicates based on URL and title similarity
- `createBackup()` / `restoreBackup()` — backup creation and restoration
- `batchMoveBookmarks()` — bulk moves bookmarks into specified folders

---

## Technical Details

- **Manifest V3**, fully client-side, no backend service
- All data uses the browser Storage API; no network requests
- CSP compliant: no inline `onclick`; all events bound via `addEventListener`
- Similarity algorithm based on Levenshtein distance (edit distance); threshold adjustable in Settings (default 80%)
- Deleting folders automatically uses `removeTree()` for non-empty directories, avoiding `remove()` exceptions

---

## Known Limitations

- If you have thousands of bookmarks, scanning may take a few seconds and the UI will show a progress bar
- Backup data is stored locally in the browser and will be lost if the extension is uninstalled; please export important backups to files
- If a custom rule has the same name as an existing folder, bookmarks may be merged into that folder

---

## Screenshots

**Scan Analysis Page**  
![Scan Analysis](docs/screenshots/scan.png)

**Category Suggestions Page**  
![Category Suggestions](docs/screenshots/categories.png)

**Duplicate Detection — Tab Filtering**  
![Duplicate Detection](docs/screenshots/duplicates.png)

**Backup Management**  
![Backup Management](docs/screenshots/backups.png)

---

## License

This project is open-sourced under the [MIT License](LICENSE).

In short, you are free to use, modify, and distribute this code, including for commercial projects. The only requirement is to retain the original license and copyright notice when redistributing.

---

## Feedback

For questions or suggestions, please open an [Issue](https://github.com/cheechang/BookmarkOrganizer/issues). The codebase is under active development; PRs are welcome.
