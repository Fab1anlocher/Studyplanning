# StudyPlanner App 📚

Eine intelligente Web-Anwendung zur Semesterplanung mit KI-Unterstützung. StudyPlanner erstellt automatisch einen personalisierten Lernplan basierend auf deinen Modulen und verfügbaren Zeitfenstern.

![StudyPlanner Welcome](https://github.com/user-attachments/assets/44df492b-2d36-4972-a013-631dfacfe3d5)

## ✨ Features

- **📄 PDF-Analyse**: Upload von Modulbeschreibungen mit automatischer Informationsextraktion
- **📅 Wochenplaner**: Interaktive Auswahl deiner verfügbaren Lernzeiten
- **🤖 KI-Lernplan**: Personalisierter Lernplan mit optimalen Lernmethoden und zeitlicher Verteilung
- **📊 Kalenderansicht**: Übersichtliche Darstellung aller Lernsessions

## 🚀 Installation & Start

### Voraussetzungen

- **Node.js** (Version 18+) - [Download](https://nodejs.org/)
- **OpenAI API-Key** - [Erstellen](https://platform.openai.com/api-keys)

### Los geht's

```bash
# Repository klonen
git clone https://github.com/Fab1anlocher/Studyplanning.git
cd Studyplanning

# Abhängigkeiten installieren
npm install

# App starten
npm run dev
```

Die App öffnet sich automatisch unter `http://localhost:3000`. Gib deinen OpenAI API-Key ein und folge den Schritten in der App.

## 📖 So funktioniert's

1. **API-Key eingeben**: Dein OpenAI API-Key wird nur lokal gespeichert
2. **Module hochladen**: PDFs mit Modulbeschreibungen uploaden - die KI extrahiert automatisch Namen, ECTS, Workload und Prüfungsform
3. **Lernzeiten wählen**: Markiere deine verfügbaren Zeitfenster im Wochenplaner
4. **Lernplan generieren**: Die KI erstellt einen personalisierten Plan mit optimaler Zeitverteilung und passenden Lernmethoden

## 🛠️ Technologie

- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **OpenAI GPT-4o-mini** für KI-Funktionen
- **PDF.js** für PDF-Verarbeitung
- **Radix UI** & **Tailwind CSS** für das Interface

## 🐛 Häufige Probleme

- **API-Key ungültig**: Überprüfe, dass der Key mit `sk-` beginnt und dein OpenAI-Account Guthaben hat
- **Probleme beim Start**: Lösche `node_modules` und führe `npm install` erneut aus


---

*Erstellt mit ❤️ für effizientes Lernen*
