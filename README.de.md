# Bookmark Organizer

Intelligent, lokal und datenschutzorientiert — organisiere deine Browser-Lesezeichen automatisch.

Eine Browser-Erweiterung, die Lesezeichen scannt, kategorisiert, Duplikate entfernt und Backups erstellt. Die gesamte Verarbeitung erfolgt vollstaendig auf deinem Geraet; nichts wird auf einen Server hochgeladen.

[English](README.md) | [中文](README.zh-CN.md) | [Español](README.es.md) | [日本語](README.ja.md) | **Deutsch**

README aktualisiert: 2026-04-23 · Aktuelle Version: `1.9.6` · Versionshinweise: [CHANGELOG.md](CHANGELOG.md)

---

## Projektziel

Bookmark Organizer ist eine Browser-Erweiterung, die mit nativem JavaScript und Manifest V3 erstellt wurde. Sie zielt nicht darauf ab, deinen Lesezeichen-Manager zu ersetzen, sondern den, den du bereits hast, wieder wirklich nutzbar zu machen.

- **Organisation zuerst**: Schlaegt automatisch Kategorien basierend auf Titel, URL und Domain-Schluesselwoertern vor. Benutzerdefinierte Regeln koennen ueber die UI oder JSON hinzugefuegt werden.
- **Bereinigung zuerst**: Erkennt exakte Duplikate, normalisierte Duplikate (gleicher Pfad, unterschiedliche Parameter) und aehnliche Duplikate (gleiche Domain, aehnliche Titel).
- **Sicherheit zuerst**: Jeder Scan erstellt automatisch ein Backup. Behaelt die letzten 10 Backups lokal, mit Ein-Klick-Wiederherstellung und manuellem JSON/HTML-Export/Import.
- **Datenschutz zuerst**: Alle Daten verbleiben im Browser-Speicher. Keine Netzwerkanfragen, keine Telemetrie, keine Konten.
- **Personalisierung zuerst**: 8 integrierte Skins + benutzerdefinierter Skin-Generator (lade ein beliebiges Bild hoch). Vollstaendige Unterstuetzung fuer Dunkelmodus und i18n in 5 Sprachen.

> **Important**
>
> Die Standardkonfiguration der Erweiterung ist fuer allgemeine Nutzung ausgelegt. Besuche nach der Installation **Einstellungen**, um den Aehnlichkeitsschwellenwert, das automatische Backup-Verhalten, den Skin und die benutzerdefinierten Kategorieregeln anzupassen.

---

## Screenshots

**Scan-Analyseseite**  
![Scan-Analyse](docs/screenshots/scan.png)

**Kategorievorschlaege-Seite**  
![Kategorievorschlaege](docs/screenshots/categories.png)

**Duplikaterkennung — Tab-Filterung**  
![Duplikaterkennung](docs/screenshots/duplicates.png)

**Backup-Verwaltung**  
![Backup-Verwaltung](docs/screenshots/backups.png)

---

## Download & Installation

| Element | Details |
| --- | --- |
| Neueste Version | [GitHub Releases](https://github.com/cheechang/BookmarkOrganizer/releases) |
| Edge Add-ons | [Bookmark Organizer](https://www.crxsoso.com/addon/detail/obmalmnejfkdbbphdmlkimjhfefgfcem) |
| Firefox Add-ons | [BookmarkTidy](https://addons.crxsoso.com/zh-CN/firefox/addon/bookmarktidy/) |
| Browser | Chrome / Edge / Firefox / Chromium-basierte |
| Berechtigungen | Bookmarks, Storage, Downloads |

### Methode 1: Browser-Erweiterungs-Store

Installiere direkt ueber die obigen Store-Links. Die Erweiterung wird automatisch aktualisiert.

### Methode 2: Entwicklermodus (fuer Tests oder persoenliche Nutzung)

1. Klone das Repository:
   ```bash
   git clone https://github.com/cheechang/BookmarkOrganizer.git
   cd BookmarkOrganizer
   ```

2. Stelle sicher, dass das Verzeichnis `icons/` PNG-Dateien in den folgenden genauen Groessen enthaelt:
   - `icon16.png` — 16x16
   - `icon48.png` — 48x48
   - `icon128.png` — 128x128

   Wenn du nur ein SVG hast, verwende einen beliebigen Online-Konverter, um die PNGs zu generieren.

3. Oeffne die Erweiterungsverwaltungsseite deines Browsers (z. B. `edge://extensions/` in Edge) und aktiviere den **Entwicklermodus** in der oberen rechten Ecke.

4. Klicke auf **Entpackte Erweiterung laden** und waehle das Projektstammverzeichnis aus.

5. Das Erweiterungssymbol erscheint in der Symbolleiste. Klicke darauf, um es zu nutzen.

---

## Kernfunktionen

| Modul | Funktion |
| --- | --- |
| Intelligente Kategorisierung | Scannt Lesezeichen und schlaegt Ordner basierend auf Schluesselwoertern in Titel/URL/Domain vor. Konfidenzwert (Hoch / Mittel / Niedrig). Unterstuetzung fuer benutzerdefinierte Regeln ueber UI oder `rules/categories.json`. |
| Duplikaterkennung | Drei Typen: exakt (identische URL), normalisiert (gleicher Pfad, unterschiedliche Parameter) und aehnlich (gleiche Domain, vergleichbare Titel). Gewichteter Aehnlichkeitsalgorithmus (Titel 60%, URL 40%). |
| Intelligente Auswahl | Duplikatgruppen werden intelligent vorausgewaehlt: Erhaelt Kopien in der Lesezeichenleiste, der Rest wird automatisch fuer die Bereinigung mit einem Klick markiert. |
| Backup & Wiederherstellung | Automatisches Backup vor dem Scan. Behaelt die letzten 10 Backups mit automatischer Bereinigung. Ein-Klick-Wiederherstellung. Unterstuetzung fuer Export als JSON oder Standard-Netscape-HTML. |
| Tote-Link-Pruefung | Erkennt unerreichbare Lesezeichen ueber HTTP HEAD/GET mit Timeout. Identifiziert 404, 5xx, Timeouts und Netzwerkfehler. Batch-Loeschen mit Backup-Integration. |
| Cross-Browser Import/Export | Importiert Standard-Netscape-Bookmark-HTML aus Chrome, Firefox, Edge, Safari. Exportiert als HTML oder JSON. Modus Zusammenfuehren oder Ersetzen. |
| Skin-System | 8 integrierte Skins (Standard, Browser-Nativ, Minimalist Business, Klassische Nostalgie, Hochkontrast-Monochrom, Milchglas, Natur-Niedrigsättigung, plus 4 Gradient-Themen). Benutzerdefinierter Skin-Generator aus jedem hochgeladenen Bild. |
| Vollstaendiges i18n | Vollstaendige UI-Uebersetzung in 5 Sprachen: Englisch, Chinesisch (vereinfacht), Spanisch, Japanisch, Deutsch. Echtzeitwechsel mit sofortigem Neu-Rendering. |
| Dunkelmodus | Wechsle mit einem Klick zwischen hellen und dunklen Themen. Die Praeferenz wird im Browser-Speicher gespeichert. Alle Skins enthalten dedizierte dunkle Paletten. |

---

## Erlebnisdesign

Die Oberflaeche von Bookmark Organizer ist um "Klarheit, Effizienz und visuellen Komfort" herum aufgebaut.

- **Duale Oberflaeche**: Vollstaendige Standalone-Seite (`options.html`) mit Seitenleisten-Navigation, plus kompaktes Popup (`popup.html`) fuer schnellen Zugriff. Klicke auf das Symbol in der Symbolleiste, um die vollstaendige Seite direkt zu oeffnen.
- **Linke Seitenleisten-Navigation**: Scannen, Kategorien, Duplikate, Tote Links, Backups, Einstellungen — jede mit benutzerdefinierten SVG-Symbolen und Aktiv-Status-Indikatoren.
- **Adaptive Skins**: Jedes UI-Element — Seitenleiste, Karten, Listen, Formulare, Fortschrittsbalken, Filter-Tags — reagiert dynamisch auf den ausgewaehlten Skin und den hellen/dunklen Modus ueber CSS-Custom-Properties.
- **Automatische DPI-Anpassung**: CSS-Media-Queries verarbeiten Bildschirmskalierungen von 100%, 125%, 150% und 200%+ um Layout-Brueche auf High-DPI-Bildschirmen zu verhindern.
- **Inline-Aktionen**: Batch-Auswahl, einzelnes Loeschen, Auf-/Zuklappen, sortierbare Spalten und schwebende Scroll-Assist-Buttons halten Interaktionen in Reichweite.

---

## Skin-System

| Skin | Beschreibung |
| --- | --- |
| Standard | Sauberer Lila-Blau-Verlauf in der Seitenleiste mit neutralem hellem Inhaltsbereich. |
| Browser-Nativ | Passt sich dem nativen UI-Ton des Host-Browsers fuer nahtlose Integration an. |
| Minimalist Business | Kuehle, professionelle Blau-Grau-Palette fuer eine fokussierte Arbeitsumgebung. |
| Klassische Nostalgie | Warmes, retro Papier-und-Tinte-Aesthetik mit Sepia-Toenen. |
| Hochkontrast-Monochrom | Reines Schwarz und Weiss fuer maximale Barrierefreiheit und Lesbarkeit. |
| Milchglas | Moderner Look mit transluzentem Unschaerfe-Effekt und dynamischem Hintergrund. |
| Natur-Niedrigsättigung | Weiche, augenfreundliche Gruen-Beige-Toene zur Reduzierung von visueller Ermuedung. |
| Ozean-Tief | Tiefblauer Gradienten-Look, inspiriert vom Ozean. |
| Sonnenuntergang-Gluehen | Warmes Orange-Rot-Gradienten-Look, inspiriert vom Sonnenuntergang. |
| Sternenklare Nacht | Tiefes Lila-Blau-Gradienten-Look mit himmlischer Atmosphaere. |
| Kirschbluete | Sanfter Rosa-Gradienten-Look mit romantischen Sakura-Farben. |
| **Benutzerdefinierter Skin** | Lade ein beliebiges Bild hoch; die Erweiterung extrahiert die dominanten Farben und generiert ein personalisiertes Thema mit automatischer Kontrast-Konformitaet. |

> **Hinweis**
>
> Benutzerdefinierte Skins werden lokal im Browser-Speicher gespeichert. Sie bleiben ueber Sitzungen hinweg erhalten und sind sowohl im Popup als auch in der vollstaendigen Seitenoberflaeche verfuegbar.

---

## Technologie-Stack

| Kategorie | Auswahl |
| --- | --- |
| Sprache | Natives JavaScript (ES2020+) |
| Architektur | ES Modules — modulare Importe ohne Bundler |
| Manifest | Manifest V3 (Chromium) / Manifest V3 mit `background.scripts` (Firefox) |
| UI | Handgeschriebenes HTML + CSS, kein Framework |
| Styling | CSS Custom Properties (`--bo-*`) fuer das Skin-System, `color-mix()` fuer adaptive Toene |
| Speicher | `chrome.storage.local` fuer Einstellungen, Backups, Logs und benutzerdefinierte Regeln |
| Lesezeichen-API | `chrome.bookmarks` zum Lesen, Erstellen, Verschieben, Entfernen und Durchlaufen von Baeumen |
| Aehnlichkeit | Levenshtein-Distanz (Edit-Distanz) mit gewichtetem Titel/URL-Durchschnitt |
| i18n | `_locales/` mit `__MSG_*__` Platzhaltern und `_t()` Runtime-Engine |
| Symbole | Benutzerdefinierte SVG-Linienstil-Symbole mit `currentColor` fuer Theme-Anpassung |
| CI/CD | GitHub Actions — Cross-Platform-Matrix-Build fuer Chromium + Firefox |

---

## Projektstruktur

````bash
BookmarkOrganizer/
├── manifest.json              # Chromium-Erweiterungskonfiguration (MV3)
├── manifest-firefox.json      # Firefox-Erweiterungskonfiguration (MV3)
├── background.js              # Service Worker: Installationsereignisse, Icon-Klick-Handler
├── options.html/css/js        # Vollstaendige Standalone-Oberflaeche
├── popup.html/css/js          # Kompakte Popup-Oberflaeche
├── i18n.js                    # Laufzeit-Uebersetzungs-Engine
├── theme-system.css           # Skin-System: 8+ Skins x hell/dunkel Variablen
│
├── shared.js                  # Reine Utility-Funktionen (escapeHtml, etc.)
├── bookmark-scanner.js        # Lesezeichen-Scanning, Analyse, tote Link-Erkennung
├── category-manager.js        # Intelligente Kategorisierung und Batch-Verschiebeoperationen
├── duplicate-detector.js      # Duplikaterkennung: exakt, normalisiert, aehnlich
├── backup-manager.js          # Backup/Wiederherstellung, HTML/JSON Import & Export
├── logger.js                  # Clientseitiges Debug-Logging-Framework
├── utils.js                   # Legacy-Shared-Utilities (Abwaertskompatibilitaet)
│
├── rules/
│   └── categories.json        # Standard-Kategorieregeln
├── _locales/                  # i18n-Nachrichten: en, zh_CN, es, ja, de
├── icons/                     # Erweiterungssymbole (16px, 48px, 128px)
├── docs/
│   ├── screenshots/           # UI-Screenshots fuer README
│   ├── DEVELOPMENT_LOG.md     # Entwicklungsgeschichte
│   └── STORE_LISTING.md       # Store-Listing-Text
├── .github/
│   └── workflows/
│       └── release.yml        # Automatisierte Build- & Release-Pipeline
├── CHANGELOG.md               # Versionshistorie
├── PRIVACY_POLICY.md          # Datenschutzrichtlinie (fuer Store-Einreichung erforderlich)
└── LICENSE                    # MIT-Lizenz
````

---

## Build

Kein Build-Schritt erforderlich. Dies ist eine handgeschriebene native Erweiterung mit Laufzeit-Null-Abhaengigkeiten.

```bash
git clone https://github.com/cheechang/BookmarkOrganizer.git
cd BookmarkOrganizer
```

Lade das Projektstammverzeichnis direkt im Entwicklermodus deines Browsers (siehe [Download & Installation](#download--installation)).

CI-Packaging (verwendet von GitHub Actions):

```bash
# Chromium-Paket
zip -r BookmarkOrganizer-v1.9.6.zip manifest.json *.js *.css *.html rules/ _locales/ icons/ -x "*.map" "node_modules/*"

# Firefox-Paket
# (manifest-firefox.json wird vor dem Packaging zu manifest.json umbenannt)
```

---

## Dokumentation

| Inhalt | Link |
| --- | --- |
| Changelog | [CHANGELOG.md](CHANGELOG.md) |
| Datenschutzrichtlinie | [PRIVACY_POLICY.md](PRIVACY_POLICY.md) |
| Entwicklungslog | [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) |
| Store-Listing | [docs/STORE_LISTING.md](docs/STORE_LISTING.md) |

---

## Juengste Updates

Aktuelle Version: **1.9.6**. Die vollstaendigen Versionshinweise findest du in [CHANGELOG.md](CHANGELOG.md). Highlights von v1.9.6:

- 4 neue Gradienten-Skins: Ozean-Tief, Sonnenuntergang-Gluehen, Sternenklare Nacht, Kirschbluete.
- Neue Benutzerdefinierter-Skin-Funktion: Lade ein beliebiges Bild hoch, um ein personalisiertes Thema mit automatischer Farbextraktion und Kontrast-Konformitaet zu generieren.
- Korrektur der Seitenleisten-Theme-Anpassung in allen Skins und Modi; Ersetzung von hartcodierten Farben durch CSS-Variablen.
- Verbesserung des Farbkontrasts der Skins im Dunkelmodus fuer bessere Lesbarkeit.
- Korrektur des Changelog-Extraktions-Regex im Release-Workflow.

---

## Roadmap

| Status | Richtung |
| --- | --- |
| Abgeschlossen | Intelligente Kategorisierung, Duplikaterkennung (3 Typen), Backup/Wiederherstellung, tote Link-Erkennung, Cross-Browser Import/Export, benutzerdefinierte Kategorieregeln, vollstaendiges i18n (5 Sprachen), Dunkelmodus, 8+ Skins, benutzerdefinierter Skin-Generator, automatische Update-Pruefung, modulare ES-Module-Architektur, Debug-Logging-System |
| In Bearbeitung | Wiki-Dokumentation, Leistungsbenchmarks fuer grosse Lesezeichen-Sets (5000+), zusaetzliche Skin-Voreinstellungen |
| Geplant | Cloud-Sync fuer Backups, Lesezeichen-Nutzungsstatistiken, tag-basierte Organisation, Suche innerhalb von Lesezeichen, Tastaturkuerzel |

---

## Mitwirken

Issues und Pull Requests sind willkommen.

1. Forke dieses Repository.
2. Erstelle einen Feature- oder Fix-Branch von `main`.
3. Halte Aenderungen fokussiert und ergaenze relevante Testschritte in deiner PR-Beschreibung.
4. Reiche den PR mit einer klaren Erklaerung des Zwecks der Aenderung, des Einflussbereichs und der Verifizierungsergebnisse ein.

Prioritaet haben reproduzierbare Probleme, klare Funktionsergaenzungen, echte Geraete-Feedback und Korrekturen mit Verifizierungsprotokollen.

---

## Danksagungen

Bookmark Organizer basiert auf standard Web-Platform-APIs und buendelt keine Drittanbieter-Laufzeitbibliotheken. Die folgenden Tools und Ressourcen wurden waehrend der Entwicklung verwendet:

| Projekt / Ressource | Verwendung |
| --- | --- |
| Chrome Extensions API | Bookmarks, Storage, Downloads, Action, i18n |
| Levenshtein-Distanz | Aehnlichkeitsbewertung fuer Duplikaterkennung |
| CSS Custom Properties | Skin-Theme-System mit dynamischer Variablen-Kaskade |
| GitHub Actions | Automatisierte Cross-Platform Build- & Release-Pipeline |
| sharp (Node.js) | Batch-Icon-Generierung waehrend der Entwicklung |

---

## Haftungsausschluss

> **Caution**
>
> 1. Diese Erweiterung modifiziert deine Browser-Lesezeichen. Obwohl vor jedem Scan automatisch Backups erstellt werden, wird dringend empfohlen, vor der ersten Nutzung ein manuelles Backup zu exportieren.
> 2. Die gesamte Datenverarbeitung erfolgt lokal in deinem Browser. Es werden keine Lesezeichendaten auf einen Server hochgeladen.
> 3. Die tote Link-Pruefung sendet HTTP-Anfragen an deine Lesezeichen-URLs. Stelle sicher, dass dies mit deiner Netzwerkumgebung und lokalen Vorschriften uebereinstimmt.
> 4. Bei Datenverlust oder unerwartetem Verhalten stelle sofort von der Backup-Verwaltungsseite wieder her.

---

## Lizenz

[MIT-Lizenz](LICENSE)

Du kannst diesen Code frei verwenden, modifizieren und verteilen, auch fuer kommerzielle Projekte. Die einzige Anforderung ist, die urspruengliche Lizenz und den Urheberrechtshinweis bei der Weiterverteilung beizubehalten.

---

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cheechang/BookmarkOrganizer&type=Date)](https://star-history.com/#cheechang/BookmarkOrganizer&Date)

---

Gemacht von [cheechang](https://github.com/cheechang)
