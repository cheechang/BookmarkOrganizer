# Bookmark Organizer

[English](README.md) | [中文](README.zh-CN.md) | [Español](README.es.md) | [日本語](README.ja.md) | **Deutsch**

Browser-Lesezeichen sich anhäufen zu lassen, ist schmerzhaft. Nachdem Hunderte davon angehäuft wurden, erfordert das Auffinden von Inhalten eine Suche, und die Lesezeichenleiste wird nutzlos. Diese Erweiterung wurde entwickelt, um dieses Problem zu lösen.

Bookmark Organizer ist eine Browser-Erweiterung, die unordentliche Lesezeichen automatisch in Kategorien sortiert, Duplikate findet und vor jeder Änderung ein Backup erstellt — damit Sie mit einem Klick wiederherstellen können, wenn etwas schiefgeht. Die gesamte Datenverarbeitung erfolgt lokal auf Ihrem Gerät; nichts wird auf einen Server hochgeladen.

---

## Was Es Tut

### 1. Intelligente Kategorisierung
Scannt alle Ihre Lesezeichen und schlägt automatisch Kategorien basierend auf Titel, URL und Domain vor. Zum Beispiel werden Lesezeichen, die "github" oder "stackoverflow" enthalten, unter "Entwicklung" gruppiert, während "bilibili" oder "youtube" unter "Unterhaltung" eingeordnet werden. Jeder Vorschlag enthält einen Konfidenzwert (Hoch / Mittel / Niedrig). Sie können Vorschläge selektiv anwenden oder diejenigen abwählen, die Sie nicht möchten.

Kategorieregeln sind in `rules/categories.json` definiert. Sie können neue Kategorien hinzufügen oder Schlüsselwörter ändern, ohne Code zu berühren.

Alternativ öffnen Sie die Seite **Einstellungen** und verwenden Sie den Abschnitt **Benutzerdefinierte Kategorieregeln**, um Regeln direkt über die Benutzeroberfläche hinzuzufügen, zu bearbeiten oder zu löschen. Hier erstellte Regeln werden im Browserspeicher gespeichert und haben Vorrang vor den Standardregeln in `categories.json`.

### 2. Duplikaterkennung
Findet zwei Arten von Duplikaten:
- **Exakte Duplikate** — Lesezeichen mit identischer URL
- **Ähnliche Duplikate** — Lesezeichen auf derselben Domain mit sehr ähnlichen Titeln (z. B. "React - Offizielle Dokumentation" und "React Docs")

Ergebnisse werden mit Filter-Tabs oben angezeigt. Jeder Tab repräsentiert eine Duplikatgruppe; klicken Sie auf einen Tab, um nur diese Gruppe anzuzeigen. Sie können Elemente zur Massenlöschung auswählen oder einzelne Lesezeichen mit der 🗑-Schaltfläche rechts entfernen. Die Benutzeroberfläche aktualisiert sich nach dem Löschen sofort ohne erneuten Scan.

Bewegen Sie den Mauszeiger über einen Tab, um den vollständigen Lesezeichentitel und die URL zur Bestätigung zu sehen.

### 3. Backup & Wiederherstellung
Jeder Scan erstellt automatisch ein Backup Ihres gesamten Lesezeichenbaums. Backups werden im lokalen Speicher des Browsers gespeichert, wobei die letzten 10 behalten und ältere automatisch bereinigt werden. Wenn eine Kategorisierung schiefgeht, öffnen Sie die Seite "Backup-Verwaltung" und klicken Sie auf "Wiederherstellen", um zurückzusetzen.

Sie können Backups auch manuell als JSON-Dateien auf Ihren Computer exportieren, um eine einfache Migration oder Neuinstallation zu ermöglichen.

### 4. Doppelte Benutzeroberfläche
Klicken Sie auf das Symbol in der Symbolleiste, um die **Vollbild-Oberfläche** (`options.html`) zu öffnen. Die linke Seitenleiste bietet Navigation über fünf Seiten: Scan, Kategorien, Duplikate, Backups und Einstellungen. Die Seite bleibt geöffnet, auch wenn Sie außerhalb klicken.

---

## Installation

### Methode 1: Entwicklermodus (zum Testen oder persönlichen Gebrauch)

1. Klonen Sie das Repository:
   ```bash
   git clone https://github.com/cheechang/BookmarkOrganizer.git
   cd BookmarkOrganizer
   ```

2. Stellen Sie sicher, dass das Verzeichnis `icons/` PNG-Dateien in den folgenden genauen Größen enthält:
   - `icon16.png` — 16×16
   - `icon48.png` — 48×48
   - `icon128.png` — 128×128

   Wenn Sie nur ein SVG haben, verwenden Sie einen beliebigen Online-Konverter, um die PNGs zu generieren.

3. Öffnen Sie die Erweiterungsverwaltungsseite Ihres Browsers (z. B. `edge://extensions/` in Edge) und aktivieren Sie den "Entwicklermodus" in der oberen rechten Ecke.

4. Klicken Sie auf "Entpackte Erweiterung laden" und wählen Sie das Projektstammverzeichnis.

5. Das Erweiterungssymbol erscheint in der Symbolleiste. Klicken Sie darauf, um es zu nutzen.

### Methode 2: Browser-Erweiterungs-Store

Eingereicht bei Microsoft Edge Add-ons. Sobald genehmigt, suchen Sie nach "Bookmark Organizer", um es zu installieren.

---

## Verwendung

**Schritt 1: Scannen**

Öffnen Sie die Erweiterung und klicken Sie auf "Scan starten". Die Erweiterung durchläuft alle Ihre Lesezeichen und analysiert die Anzahl nicht kategorisierter, doppelter und kategorisierter Lesezeichen. Vor dem Scan wird automatisch ein Backup erstellt.

**Schritt 2: Kategorisieren**

Wechseln Sie zur Seite "Kategorievorschläge", um empfohlene Ordnerstrukturen und Zielorte für jedes Lesezeichen zu sehen. Deaktivieren Sie Elemente, die Sie nicht verschieben möchten, und klicken Sie dann auf "Ausgewählte Kategorien anwenden". Die Erweiterung erstellt automatisch fehlende Ordner und verschiebt die Lesezeichen entsprechend.

**Schritt 3: Duplikate entfernen**

Wechseln Sie zur Seite "Duplikaterkennung". Eine Reihe von Tabs oben zeigt den Namen und die Anzahl jeder Duplikatgruppe. Klicken Sie auf einen Tab, um diese Gruppe zu filtern. Die Erweiterung **wählt Duplikate standardmäßig intelligent aus**: Kopien in der Lesezeichenleiste bleiben erhalten, während Duplikate außerhalb automatisch für die Bereinigung mit einem Klick markiert werden. Sie können Auswahlen auch manuell anpassen oder einzelne Lesezeichen mit der Löschschaltfläche rechts entfernen.

**Schritt 4: Backup-Verwaltung**

Die Seite "Backup-Verwaltung" listet alle historischen Backups mit Erstellungszeit und Lesezeichenanzahl auf. Klicken Sie auf "Wiederherstellen", um zurückzusetzen, oder auf "Löschen", um Speicherplatz freizugeben. Wir empfehlen, wichtige Backups regelmäßig als lokale JSON-Dateien zu exportieren.

---

## Anpassen von Kategorieregeln

### Methode 1: Über die Einstellungen-UI (Empfohlen)

Öffnen Sie die Seite **Einstellungen** der Erweiterung, finden Sie den Abschnitt **Benutzerdefinierte Kategorieregeln** und klicken Sie auf **Regel hinzufügen**. Jede Regel erfordert:

- **Kategoriename** — der Name des Ordners, der erstellt wird (z. B. "Arbeit")
- **Passende Schlüsselwörter** — durch Kommas getrennt, zur Übereinstimmung mit Lesezeichentiteln (z. B. `work, office, meeting`)
- **Passende Domains** — durch Kommas getrennt, zur Übereinstimmung mit Lesezeichen-URLs (z. B. `slack.com, notion.so`)

Regeln werden automatisch im Browserspeicher gespeichert und wirken sich sofort beim nächsten Scan aus. Sie können sie jederzeit bearbeiten oder löschen.

> **Hinweis:** Diese Methode erfordert die Bearbeitung der Quelldateien der Erweiterung und ist für **Entwickler** gedacht, die die Erweiterung aus dem Quellcode erstellen möchten. Normale Benutzer sollten stattdessen **Methode 1** verwenden.

### Methode 2: `rules/categories.json` Direkt Bearbeiten

Bearbeiten Sie die JSON-Datei und fügen Sie Einträge im folgenden Format hinzu:

```json
{
  "categories": [
    {
      "name": "Ihre Kategorie",
      "keywords": ["schlüsselwort1", "schlüsselwort2"],
      "domains": ["example.com", "test.org"]
    }
  ]
}
```

Nach der Änderung laden Sie die Erweiterung neu, indem Sie auf die Aktualisierungsschaltfläche auf der Erweiterungskarte in der Erweiterungsverwaltungsseite klicken.

---

## Projektstruktur

| Datei / Verzeichnis | Beschreibung |
|---|---|
| `manifest.json` | Erweiterungskonfiguration, Manifest V3 |
| `background.js` | Service Worker; verwaltet Installationsereignisse und Symbolklicks |
| `popup.html` / `popup.css` / `popup.js` | Popup-Oberfläche (Schnellmodus) |
| `options.html` / `options.css` / `options.js` | Vollbild-Standalone-Oberfläche |
| `utils.js` | Gemeinsame Dienstprogramme: Kategorisierungs-Engine, Duplikaterkennung, Backup-Logik, Lesezeichenoperationen |
| `rules/categories.json` | Standard-Kategorieregeln |
| `icons/` | Erweiterungssymbole (16px, 48px, 128px) |
| `docs/` | Entwicklungsdokumentation und Änderungsprotokolle |
| `PRIVACY_POLICY.md` | Datenschutzrichtlinie (für Store-Einreichung erforderlich) |

Die Kernlogik befindet sich in `utils.js`:
- `analyzeBookmarks()` — scannt und generiert Kategorievorschläge und Duplikaterkennungsergebnisse
- `detectDuplicates()` — erkennt Duplikate basierend auf URL und Titelsimilarität
- `createBackup()` / `restoreBackup()` — Backup-Erstellung und -Wiederherstellung
- `batchMoveBookmarks()` — verschiebt Lesezeichen massenweise in angegebene Ordner

---

## Technische Details

- **Manifest V3**, vollständig clientseitig, kein Backend-Dienst
- Alle Daten verwenden die Storage API des Browsers; keine Netzwerkanfragen
- CSP-konform: kein Inline-`onclick`; alle Ereignisse über `addEventListener` gebunden
- Similaritätsalgorithmus basierend auf Levenshtein-Distanz; Schwellenwert in den Einstellungen anpassbar (Standard 80%)
- Beim Löschen von Ordnern wird automatisch `removeTree()` für nicht-leere Verzeichnisse verwendet, um `remove()`-Ausnahmen zu vermeiden

---

## Bekannte Einschränkungen

- Wenn Sie Tausende von Lesezeichen haben, kann der Scan einige Sekunden dauern und die Benutzeroberfläche zeigt einen Fortschrittsbalken
- Backup-Daten werden lokal im Browser gespeichert und gehen verloren, wenn die Erweiterung deinstalliert wird; bitte exportieren Sie wichtige Backups in Dateien
- Wenn eine benutzerdefinierte Regel denselben Namen wie ein vorhandener Ordner hat, können Lesezeichen in diesen Ordner zusammengeführt werden

---

## Screenshots

**Scan-Analyseseite**  
![Scan-Analyse](docs/screenshots/scan.png)

**Kategorievorschläge-Seite**  
![Kategorievorschläge](docs/screenshots/categories.png)

**Duplikaterkennung — Tab-Filterung**  
![Duplikaterkennung](docs/screenshots/duplicates.png)

**Backup-Verwaltung**  
![Backup-Verwaltung](docs/screenshots/backups.png)

---

## Lizenz

Dieses Projekt ist unter der [MIT-Lizenz](LICENSE) Open Source.

Kurz gesagt, Sie können diesen Code frei verwenden, ändern und verteilen, auch für kommerzielle Projekte. Die einzige Anforderung ist, die ursprüngliche Lizenz und den Urheberrechtshinweis bei der Weiterverteilung beizubehalten.

---

## Feedback

Bei Fragen oder Vorschlägen öffnen Sie bitte ein [Issue](https://github.com/cheechang/BookmarkOrganizer/issues). Die Codebasis befindet sich in aktiver Entwicklung; PRs sind willkommen.
