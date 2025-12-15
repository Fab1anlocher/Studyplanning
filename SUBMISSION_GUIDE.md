# Abgabe-Anleitung / Submission Guide

## So erstellen Sie die ZIP-Datei für die Abgabe

### Option 1: Mit Git (empfohlen)
```bash
# ZIP-Archiv vom aktuellen Branch erstellen
git archive -o studyplanner-abgabe.zip HEAD

# Oder ZIP-Archiv mit Prefix für bessere Organisation
git archive --prefix=studyplanner/ -o studyplanner-abgabe.zip HEAD
```

### Option 2: Manuell
1. Klonen oder herunterladen Sie das Repository
2. Löschen Sie folgende Ordner (falls vorhanden):
   - `node_modules/` (wird mit `npm install` neu erstellt)
   - `build/` oder `dist/` (wird mit `npm run build` neu erstellt)
   - `.git/` (Git-Historie, nicht für Abgabe notwendig)
3. Erstellen Sie eine ZIP-Datei mit allen verbleibenden Dateien

### Was ist in der Abgabe enthalten?

**Quellcode:**
- `/src` - Alle TypeScript/React Komponenten und Services
- `/index.html` - Haupt-HTML-Datei
- `/vite.config.ts` - Build-Konfiguration
- `/package.json` - Projekt-Abhängigkeiten

**Dokumentation:**
- `README.md` - Ausführliche Projektdokumentation
- `src/Attributions.md` - Lizenzhinweise für verwendete Bibliotheken

**Konfiguration:**
- `.gitignore` - Git-Ignore-Regeln
- `package-lock.json` - Exakte Versionen der Abhängigkeiten

**Gesamt:** ~39 Dateien, ~624KB Quellcode

## Nach der Abgabe: Installation beim Dozenten

Der Dozent kann das Projekt folgendermaßen starten:

```bash
# 1. ZIP entpacken
unzip studyplanner-abgabe.zip

# 2. In das Verzeichnis wechseln
cd studyplanner

# 3. Abhängigkeiten installieren
npm install

# 4. Development-Server starten
npm run dev

# ODER: Production-Build erstellen
npm run build
```

## Wichtige Hinweise

✅ **Enthalten:** Gesamter Quellcode, Dokumentation, Konfigurationsdateien
❌ **Nicht enthalten:** node_modules (zu groß), build-Artefakte, Git-Historie
⚠️ **Sicherheit:** Keine API-Keys oder Secrets im Code - werden zur Laufzeit eingegeben

## Systemanforderungen

- Node.js Version 18 oder höher
- npm (wird mit Node.js installiert)
- Moderner Webbrowser (Chrome, Firefox, Safari, Edge)
- OpenAI API-Key für die KI-Funktionen

## Support

Bei Fragen zur Installation oder Verwendung, siehe README.md oder kontaktieren Sie den Entwickler.
