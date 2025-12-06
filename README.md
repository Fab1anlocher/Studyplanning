# StudyPlanner App 📚

Eine intelligente Web-Anwendung zur Semesterplanung mit KI-Unterstützung. StudyPlanner hilft Studierenden dabei, ihren Lernplan realistisch und effizient zu gestalten.

![StudyPlanner Welcome](https://github.com/user-attachments/assets/44df492b-2d36-4972-a013-631dfacfe3d5)

## ✨ Features

- **📄 Automatische PDF-Analyse**: Lade Modulbeschreibungen als PDF hoch und extrahiere automatisch alle wichtigen Informationen
- **📅 Visueller Wochenplaner**: Markiere deine verfügbaren Lernzeiten in einem interaktiven Grid
- **🤖 KI-gestützter Lernplan**: Die KI erstellt einen personalisierten Lernplan basierend auf deinen Modulen und Zeitfenstern
- **🎯 Intelligente Lernmethoden**: Automatische Auswahl der besten Lernmethode für jedes Modul
- **📊 Übersichtliche Darstellung**: Kalenderansicht mit allen Lernsessions

## 🚀 Schnellstart

### Voraussetzungen

Stelle sicher, dass folgende Software installiert ist:

- **Node.js** (Version 18 oder höher) - [Download](https://nodejs.org/)
- **npm** (wird mit Node.js installiert)
- **OpenAI API-Key** - [Erstellen](https://platform.openai.com/api-keys)

### Installation

1. **Repository klonen oder herunterladen**
   ```bash
   git clone https://github.com/Fab1anlocher/Studyplanning.git
   cd Studyplanning
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

   Dies installiert alle benötigten Pakete, inklusive:
   - React & React DOM
   - Vite (Build-Tool)
   - PDF.js (PDF-Verarbeitung)
   - OpenAI SDK
   - Radix UI Components
   - Weitere UI-Bibliotheken

3. **Development Server starten**
   ```bash
   npm run dev
   ```

   Die App öffnet sich automatisch im Browser unter `http://localhost:3000`

4. **App verwenden**
   - Klicke auf "Jetzt starten"
   - Gib deinen OpenAI API-Key ein ([Wie erstelle ich einen API-Key?](https://platform.openai.com/api-keys))
   - Folge den Schritten in der App

## 📖 Verwendung

### Schritt 1: API-Key eingeben
![API Key Page](https://github.com/user-attachments/assets/4707dbcd-153b-436c-a770-572974129c4e)

Gib deinen OpenAI API-Key ein. Dieser wird nur lokal gespeichert und direkt an OpenAI gesendet.

### Schritt 2: Module hochladen
![Module Upload](https://github.com/user-attachments/assets/da1dbe86-1e11-4146-9344-e7b6c31b6e5b)

Lade deine Modulbeschreibungen als PDF hoch. Die KI extrahiert automatisch:
- Modulname
- ECTS-Punkte
- Workload
- Leistungsnachweise (Prüfungen, Projekte, etc.)

### Schritt 3: Wochenplan erstellen

Wähle deine verfügbaren Lernzeiten aus:
- Klicke auf einzelne 2-Stunden-Blöcke
- Nutze die Schnellauswahl-Vorlagen
- Oder wähle ganze Tage aus

### Schritt 4: Lernplan generieren

Die KI erstellt einen personalisierten Lernplan mit:
- Optimaler zeitlicher Verteilung
- Berücksichtigung von Deadlines
- Angepassten Lernmethoden pro Modul

## 🏗️ Projekt-Struktur

```
Studyplanning/
├── src/
│   ├── components/          # React-Komponenten
│   │   ├── WelcomePage.tsx      # Startseite
│   │   ├── ApiKeyPage.tsx       # API-Key Eingabe
│   │   ├── ModuleUpload.tsx     # PDF Upload & Verwaltung
│   │   ├── WeeklySchedule.tsx   # Wochenplaner
│   │   ├── StudyPlanGenerator.tsx # Lernplan-Generierung
│   │   └── ui/                  # UI-Komponenten (Buttons, Cards, etc.)
│   ├── services/            # Backend-Services
│   │   ├── pdfExtractor.ts      # PDF-Text-Extraktion
│   │   └── aiModuleExtractor.ts # KI-basierte Datenextraktion
│   ├── App.tsx             # Haupt-App-Komponente
│   ├── main.tsx            # Entry Point
│   └── index.css           # Global Styles
├── build/                  # Build-Output (nach `npm run build`)
├── package.json            # Projekt-Abhängigkeiten
├── vite.config.ts          # Vite-Konfiguration
└── README.md              # Diese Datei
```

## 🔧 Verfügbare Skripte

### `npm run dev`
Startet den Development Server auf Port 3000.
- Hot-Reload aktiviert
- Öffnet automatisch den Browser
- Entwickler-Konsole zeigt detaillierte Logs

### `npm run build`
Erstellt eine optimierte Production-Version im `build/` Ordner.
- Minifiziert und optimiert den Code
- Splittet große Bibliotheken in separate Chunks
- Erstellt Source Maps

## 🐛 Troubleshooting

### "API-Key ungültig"
- Stelle sicher, dass dein API-Key mit `sk-` beginnt
- Überprüfe ob dein OpenAI-Account Guthaben hat
- Erstelle ggf. einen neuen Key auf [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### "PDF konnte nicht gelesen werden"
- Stelle sicher, dass die Datei wirklich eine PDF ist
- Versuche die PDF neu zu exportieren
- Manche verschlüsselte PDFs können nicht gelesen werden

### "Module werden nicht angezeigt"
- Öffne die Browser-Konsole (F12) für detaillierte Logs
- Stelle sicher, dass die KI-Extraktion erfolgreich war
- Überprüfe ob die PDF Modulinformationen enthält

### Port 3000 ist bereits belegt
Ändere den Port in `vite.config.ts`:
```typescript
server: {
  port: 3001, // Oder einen anderen freien Port
  open: true,
}
```

### Build-Fehler
```bash
# Node Modules und Cache löschen
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🔐 Sicherheit

- **API-Key**: Wird nur im Browser (localStorage) gespeichert und direkt an OpenAI gesendet
- **Keine Daten auf Server**: Alle Daten bleiben auf deinem Gerät
- **HTTPS**: In Production sollte die App über HTTPS bereitgestellt werden
- **API-Key niemals committen**: Der Key sollte niemals in Git eingecheckt werden

⚠️ **Wichtig für Production**: Die aktuelle Implementierung nutzt `dangerouslyAllowBrowser` für OpenAI. Für eine produktive Anwendung sollte ein Backend-Service verwendet werden, der die API-Calls durchführt.

## 🛠️ Technologie-Stack

- **Frontend Framework**: React 18 mit TypeScript
- **Build Tool**: Vite 6
- **UI Components**: Radix UI
- **Styling**: Tailwind CSS
- **PDF Processing**: PDF.js
- **KI Integration**: OpenAI GPT-4o-mini
- **Icons**: Lucide React

## 📝 Entwicklung

### Code-Qualität
- TypeScript für Type-Safety
- Ausführliche Kommentare im Code
- Console-Logging für Debugging
- Komponenten-basierte Architektur

### Performance
- Code-Splitting für kleinere Bundles
- Lazy Loading von großen Bibliotheken
- Memoization zur Vermeidung unnötiger Re-Renders
- Optimierte PDF-Worker-Konfiguration

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstelle einen Pull Request mit einer klaren Beschreibung der Änderungen.

## 📄 Lizenz

Dieses Projekt basiert auf dem [StudyPlanner App UI Design](https://www.figma.com/design/2Ide5BRl2XJzmRcujtsXuf/StudyPlanner-App-UI-Design) Figma-Projekt.

## 💡 Tipps für beste Ergebnisse

1. **Modulbeschreibungen**: Je detaillierter die PDF, desto besser die Extraktion
2. **Lernzeiten**: Sei realistisch bei der Auswahl deiner verfügbaren Zeiten
3. **API-Kosten**: GPT-4o-mini ist sehr günstig (~$0.15 pro Lernplan)
4. **Planung**: Generiere den Plan zu Beginn des Semesters und passe ihn regelmäßig an

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe die Troubleshooting-Sektion
2. Öffne ein Issue auf GitHub
3. Kontaktiere den Entwickler

---

Erstellt mit ❤️ für effizientes Lernen