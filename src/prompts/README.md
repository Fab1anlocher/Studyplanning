# AI Prompts für StudyPlanner

Dieser Ordner enthält alle AI-Prompts, die in der Anwendung verwendet werden. Die Prompts sind aus dem Code extrahiert, damit sie einfach bearbeitet werden können, ohne den Code selbst zu ändern.

## 📁 Dateien

### `studyPlanGenerator.ts`
Prompt für die Generierung des Semester-Lernplans. Dieser Prompt wird verwendet, wenn der Student alle Module und Zeitfenster eingegeben hat und auf "Lernplan erstellen" klickt.

**Was macht dieser Prompt?**
- Erstellt einen vollständigen Semesterplan mit vielen einzelnen Lernsessions
- Verteilt die Sessions über verfügbare Zeitfenster
- Berücksichtigt Prüfungstermine, Präsentationen und andere Assessments
- Wählt die optimale Lernmethode für jede Session

**Wichtige Variablen:**
- `{startDate}` - Startdatum des Plans
- `{lastExamDate}` - Letztes Prüfungsdatum
- `{weeksBetween}` - Anzahl Wochen zwischen Start und Ende
- `{totalSlotsPerWeek}` - Anzahl Zeitfenster pro Woche
- `{minSessions}` - Minimale Anzahl Sessions
- `{maxSessions}` - Maximale Anzahl Sessions
- `{allowedMethods}` - Erlaubte Lernmethoden

### `moduleLearningGuide.ts`
Prompt für die Generierung eines detaillierten Lernguides pro Modul. Dieser Prompt wird verwendet, wenn der Student auf "Lernguide öffnen" für ein spezifisches Modul klickt.

**Was macht dieser Prompt?**
- Erstellt einen A-Z Lernguide für ein einzelnes Modul
- Erklärt Lernmethoden detailliert
- Gibt konkrete Übungen und Ressourcen
- Erstellt einen Wochenplan mit spezifischen Aufgaben
- Bereitet auf Prüfungen/Präsentationen vor

**Wichtige Variablen:**
- `{moduleName}` - Name des Moduls
- `{ects}` - ECTS-Punkte
- `{workload}` - Workload in Stunden
- `{totalHours}` - Geplante Lernzeit
- `{sessionCount}` - Anzahl Sessions
- `{content}` - Modulinhalte
- `{competencies}` - Kompetenzen
- `{assessments}` - Prüfungen/Assessments
- `{sessionExamples}` - Beispiel-Sessions

## ✏️ Prompts bearbeiten

### Für Nicht-Technische Benutzer:

1. **Öffne die Datei in einem Text-Editor:**
   - Windows: Notepad, Notepad++, oder Visual Studio Code
   - Mac: TextEdit, Visual Studio Code
   - Online: GitHub Web-Editor (drücke `.` auf der GitHub-Seite)

2. **Finde den Text zwischen den Backticks (\`)**
   - Der eigentliche Prompt steht zwischen \`...\`
   - Alles vor `export const ... = \`` ist Dokumentation
   - Die Variablen in geschweiften Klammern `{variable}` werden automatisch ersetzt - NICHT löschen!

3. **Bearbeite den Prompt-Text:**
   - Du kannst die Anweisungen anpassen
   - Du kannst Beispiele hinzufügen oder ändern
   - Du kannst die Struktur ändern
   - **WICHTIG:** Lösche KEINE Variablen in geschweiften Klammern `{...}`

4. **Speichere die Datei:**
   - Datei muss die Endung `.ts` behalten
   - Speichere als UTF-8 Encoding

5. **Teste die Änderungen:**
   - Starte die Anwendung neu
   - Erstelle einen Lernplan oder Lernguide
   - Überprüfe das Ergebnis

## 🎯 Tipps für bessere Prompts

### Sei spezifisch:
❌ Schlecht: "Erstelle einen Plan"
✅ Gut: "Erstelle einen DETAILLIERTEN Plan mit KONKRETEN Aufgaben"

### Nutze Formatierung:
- **GROSSBUCHSTABEN** für wichtige Konzepte
- Emojis 🎯 für visuelle Marker
- Aufzählungen für Struktur
- Beispiele für Klarheit

### Gib Kontext:
Erkläre WARUM etwas wichtig ist, nicht nur WAS getan werden soll.

### Nutze Constraints:
- "NUR verwenden..." 
- "KEINE erfundenen..."
- "MUSS zwischen X und Y sein"

### Füge Validierung hinzu:
Am Ende eine Checkliste hinzufügen, was der AI überprüfen soll.

## 🔧 Technische Details

Die Prompts werden zur Laufzeit importiert und in die AI-Requests eingefügt. Die Variablen werden durch echte Werte ersetzt:

```typescript
import { STUDY_PLAN_SYSTEM_PROMPT } from '@/prompts/studyPlanGenerator';

// Variablen ersetzen
const prompt = STUDY_PLAN_SYSTEM_PROMPT
  .replace('{startDate}', actualStartDate)
  .replace('{lastExamDate}', actualLastExamDate)
  // ... etc
```

## 📝 Beispiel-Änderung

**Vorher:**
```
- Studenten brauchen praktische, realistische Pläne
```

**Nachher:**
```
- Studenten brauchen praktische, realistische Pläne die zu ihrem Alltag passen
- Berücksichtige Nebenjobs, Familie und Freizeit
- Plane nicht mehr als 4h Lernen an Arbeitstagen
```

Nach dem Speichern wird dieser neue Text automatisch in den nächsten AI-Requests verwendet!

## 🆘 Hilfe

Falls nach einer Änderung Fehler auftreten:
1. Stelle sicher, dass alle Variablen `{...}` noch da sind
2. Überprüfe, dass die Datei korrekt gespeichert wurde
3. Starte die Anwendung neu
4. Bei Syntaxfehlern: Stelle sicher, dass alle Backticks \` richtig geschlossen sind

## 🔄 Versions-Kontrolle

Wenn du größere Änderungen machst:
1. Kopiere die Original-Datei als Backup
2. Teste deine Änderungen
3. Dokumentiere was du geändert hast und warum
4. Bei Problemen: Stelle die Original-Datei wieder her
