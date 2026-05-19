# Bookmark Organizer

Smart, local, and privacy-first — automatically organize your browser bookmarks.

A browser extension that scans, categorizes, deduplicates, and backs up your bookmarks. All processing happens entirely on your device; nothing is uploaded to any server.

**English** · [中文](README.zh-CN.md) · [Español](README.es.md) · [日本語](README.ja.md) · [Deutsch](README.de.md)

README updated: 2026-04-23 · Current version: `1.9.6` · Release notes: [CHANGELOG.md](CHANGELOG.md)

---

## Project Positioning

Bookmark Organizer is a browser extension built with vanilla JavaScript and Manifest V3. It does not aim to replace your bookmark manager, but to make the one you already have actually usable again.

- **Organization-first**: Automatically suggests categories based on title, URL, and domain keywords. Custom rules can be added via UI or JSON.
- **Cleanup-first**: Detects exact duplicates, normalized duplicates (same path, different query params), and similar duplicates (same domain, similar titles).
- **Safety-first**: Every scan creates an automatic backup. Keep the last 10 backups locally, with one-click restore and manual JSON/HTML export/import.
- **Privacy-first**: All data stays in browser storage. No network requests, no telemetry, no accounts.
- **Personalization-first**: 8 built-in skins + custom skin generator (upload any image). Full dark mode and 5-language i18n support.

> **Important**
>
> The extension defaults are designed for general use. After installation, visit **Settings** to adjust the similarity threshold, auto-backup behavior, theme skin, and custom category rules.

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

## Download & Installation

| Item | Details |
| --- | --- |
| Latest Release | [GitHub Releases](https://github.com/cheechang/BookmarkOrganizer/releases) |
| Edge Add-ons | [Bookmark Organizer](https://www.crxsoso.com/addon/detail/obmalmnejfkdbbphdmlkimjhfefgfcem) |
| Firefox Add-ons | [BookmarkTidy](https://addons.crxsoso.com/zh-CN/firefox/addon/bookmarktidy/) |
| Browsers | Chrome / Edge / Firefox / Chromium-based |
| Permissions | Bookmarks, Storage, Downloads |

### Method 1: Browser Extension Store

Install directly from the store links above. The extension will update automatically.

### Method 2: Developer Mode (for testing or personal use)

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

3. Open your browser's extension management page (e.g., `edge://extensions/` in Edge), and enable **Developer mode** in the top-right corner.

4. Click **Load unpacked** and select the project root directory.

5. The extension icon will appear in the toolbar. Click it to start using.

---

## Core Capabilities

| Module | Capability |
| --- | --- |
| Smart Categorization | Scans bookmarks and suggests folders based on title/URL/domain keywords. Confidence scores (High / Medium / Low). Custom rules via UI or `rules/categories.json`. |
| Duplicate Detection | Three types: exact (identical URL), normalized (same path, different query params), and similar (same domain, comparable titles). Weighted similarity algorithm (title 60%, URL 40%). |
| Smart Selection | Duplicate groups are auto-preselected intelligently: preserves Bookmarks Bar copies, checks external duplicates for one-click cleanup. |
| Backup & Rollback | Automatic pre-scan backups. Retains last 10 backups with auto-cleanup. One-click restore. Manual export as JSON or standard Netscape HTML. |
| Broken Link Check | Detects unreachable bookmarks via HTTP HEAD/GET with timeout. Identifies 404, 5xx, timeouts, and network failures. Batch delete with backup integration. |
| Cross-browser Import/Export | Import standard Netscape Bookmark HTML from Chrome, Firefox, Edge, Safari. Export as HTML or JSON. Merge or Replace mode. |
| Theme Skin System | 8 built-in skins (Default, Browser Native, Minimalist Business, Classic Nostalgic, High-Contrast Mono, Frosted Glass, Nature Low-Saturation, plus 4 gradient themes). Custom skin generator from any uploaded image. |
| Full i18n | Complete UI translation in 5 languages: English, Chinese Simplified, Spanish, Japanese, German. Runtime switching with instant re-render. |
| Dark Mode | Toggle between light and dark themes. Preference persisted in browser storage. All skins include dedicated dark palettes. |

---

## Experience Design

Bookmark Organizer's interface is built around "clarity, efficiency, and visual comfort".

- **Dual Interface**: Full-page standalone (`options.html`) with sidebar navigation, plus a compact popup (`popup.html`) for quick access. Click the toolbar icon to open the full page directly.
- **Left Sidebar Navigation**: Scan, Categories, Duplicates, Broken Links, Backups, Settings — each with custom SVG icons and active-state indicators.
- **Adaptive Skins**: Every UI element — sidebar, cards, lists, forms, progress bars, filter tags — dynamically responds to the selected skin and light/dark mode via CSS custom properties.
- ** DPI Auto-Adaptation**: CSS media queries handle 100%, 125%, 150%, and 200%+ display scaling to prevent layout breakage on high-DPI screens.
- **Inline Actions**: Bulk select, individual delete, expand/collapse, sortable columns, and floating scroll-assist buttons keep interactions within reach.

---

## Theme Skin System

| Skin | Description |
| --- | --- |
| Default | Clean gradient purple-blue sidebar with neutral light content area. |
| Browser Native | Matches the host browser's native UI tone for seamless integration. |
| Minimalist Business | Cool, professional blue-grey palette for a focused work environment. |
| Classic Nostalgic | Warm, retro paper-and-ink aesthetic with sepia undertones. |
| High-Contrast Mono | Pure black & white for maximum accessibility and readability. |
| Frosted Glass | Translucent blur-effect modern look with dynamic backdrop. |
| Nature Low-Saturation | Soft, eye-friendly green-beige tones for reduced visual fatigue. |
| Ocean Deep | Deep blue gradient theme with ocean-inspired color palette. |
| Sunset Glow | Warm orange-red gradient theme with sunset-inspired colors. |
| Starry Night | Deep purple-blue gradient theme with celestial atmosphere. |
| Cherry Blossom | Soft pink gradient theme with romantic sakura colors. |
| **Custom Skin** | Upload any image; the extension extracts dominant colors and generates a personalized theme with automatic contrast compliance. |

> **Note**
>
> Custom skins are stored locally in browser storage. They persist across sessions and are available in both the popup and full-page interfaces.

---

## Tech Stack

| Category | Choice |
| --- | --- |
| Language | Vanilla JavaScript (ES2020+) |
| Architecture | ES Modules — modular imports with no bundler |
| Manifest | Manifest V3 (Chromium) / Manifest V3 with `background.scripts` (Firefox) |
| UI | Hand-written HTML + CSS, no framework |
| Styling | CSS Custom Properties (`--bo-*`) for skin system, `color-mix()` for adaptive tones |
| Storage | `chrome.storage.local` for settings, backups, logs, and custom rules |
| Bookmarks API | `chrome.bookmarks` for read, create, move, remove, and tree traversal |
| Similarity | Levenshtein distance (edit distance) with weighted title/URL averaging |
| i18n | `_locales/` with `__MSG_*__` placeholders and runtime `_t()` engine |
| Icons | Custom SVG line-style icons with `currentColor` for theme adaptation |
| CI/CD | GitHub Actions — cross-platform matrix build for Chromium + Firefox |

---

## Project Structure

```
BookmarkOrganizer/
├── manifest.json              # Chromium extension config (MV3)
├── manifest-firefox.json      # Firefox extension config (MV3)
├── background.js              # Service Worker: install events, icon click handler
├── options.html/css/js        # Full-page standalone interface
├── popup.html/css/js          # Compact popup interface
├── i18n.js                    # Runtime translation engine
├── theme-system.css           # Skin system: 8+ skins × light/dark variables
│
├── shared.js                  # Pure utilities (escapeHtml, etc.)
├── bookmark-scanner.js        # Bookmark scanning, analysis, broken-link detection
├── category-manager.js        # Smart categorization and batch move operations
├── duplicate-detector.js      # Duplicate detection: exact, normalized, similar
├── backup-manager.js          # Backup/restore, HTML/JSON import & export
├── logger.js                  # Client-side debug logging framework
├── utils.js                   # Legacy shared utilities (backward compatibility)
│
├── rules/
│   └── categories.json        # Default categorization keyword rules
├── _locales/                  # i18n messages: en, zh_CN, es, ja, de
├── icons/                     # Extension icons (16px, 48px, 128px)
├── docs/
│   ├── screenshots/           # UI screenshots for README
│   ├── DEVELOPMENT_LOG.md     # Development history
│   └── STORE_LISTING.md       # Store listing copy
├── .github/
│   └── workflows/
│       └── release.yml        # Automated build & release pipeline
├── CHANGELOG.md               # Version history
├── PRIVACY_POLICY.md          # Privacy policy (store submission)
└── LICENSE                    # MIT License
```

---

## Build

No build step is required. This is a hand-written native extension with zero dependencies for runtime.

```bash
git clone https://github.com/cheechang/BookmarkOrganizer.git
cd BookmarkOrganizer
```

Load the project root directly in your browser's developer mode (see [Download & Installation](#download--installation)).

For CI packaging (used by GitHub Actions):

```bash
# Chromium package
zip -r BookmarkOrganizer-v1.9.6.zip manifest.json *.js *.css *.html rules/ _locales/ icons/ -x "*.map" "node_modules/*"

# Firefox package
# (manifest-firefox.json is renamed to manifest.json before packaging)
```

---

## Documentation

| Content | Link |
| --- | --- |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Privacy Policy | [PRIVACY_POLICY.md](PRIVACY_POLICY.md) |
| Development Log | [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) |
| Store Listing | [docs/STORE_LISTING.md](docs/STORE_LISTING.md) |

---

## Recent Updates

Current version: **1.9.6**. Full release notes are in [CHANGELOG.md](CHANGELOG.md). Highlights for v1.9.6:

- Added 4 new gradient skins: Ocean Deep, Sunset Glow, Starry Night, Cherry Blossom.
- Added Custom Skin feature: upload any image to generate a personalized theme with automatic color extraction and contrast compliance.
- Fixed sidebar theme adaptation across all skins and modes; replaced hard-coded colors with CSS variables.
- Improved skin color contrast in dark mode for better readability.
- Fixed release workflow changelog extraction regex.

---

## Roadmap

| Status | Direction |
| --- | --- |
| Completed | Smart categorization, duplicate detection (3 types), backup/rollback, broken link checker, cross-browser import/export, custom category rules, full i18n (5 languages), dark mode, 8+ theme skins, custom skin generator, auto-update check, modular ES Module architecture, debug logging system |
| In Progress | Wiki documentation, performance benchmarks for large bookmark sets (5000+), additional skin presets |
| Planned | Cloud sync for backups, bookmark usage statistics, tag-based organization, search within bookmarks, keyboard shortcuts |

---

## Contributing

Issues and Pull Requests are welcome.

1. Fork this repository.
2. Create a feature or fix branch from `main`.
3. Keep changes focused and include relevant test steps in your PR description.
4. Submit the PR with a clear explanation of the change, impact, and verification results.

Priority is given to reproducible bugs, clear feature additions, real-device feedback, and fixes with verification records.

---

## Acknowledgments

Bookmark Organizer is built on standard web platform APIs and does not bundle third-party runtime libraries. The following tools and references were used during development:

| Project / Resource | Usage |
| --- | --- |
| Chrome Extensions API | Bookmarks, Storage, Downloads, Action, i18n |
| Levenshtein Distance | Similarity scoring for duplicate detection |
| CSS Custom Properties | Theme skin system with dynamic variable cascading |
| GitHub Actions | Automated cross-platform build and release pipeline |
| sharp (Node.js) | Icon batch generation during development |

---

## Disclaimer

> **Caution**
>
> 1. This extension modifies your browser bookmarks. Although automatic backups are created before every scan, we strongly recommend exporting a manual backup before the first use.
> 2. All data processing happens locally in your browser. No bookmark data is uploaded to any server.
> 3. The broken link checker sends HTTP requests to your bookmark URLs. Please ensure this complies with your network environment and local regulations.
> 4. If you encounter data loss or unexpected behavior, restore from the Backup Management page immediately.

---

## License

[MIT License](LICENSE)

You are free to use, modify, and distribute this code, including for commercial projects. The only requirement is to retain the original license and copyright notice when redistributing.

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cheechang/BookmarkOrganizer&type=Date)](https://star-history.com/#cheechang/BookmarkOrganizer&Date)

---

Made by [cheechang](https://github.com/cheechang)
