/**
 * System Prompt for Module Learning Guide Generator
 * 
 * This prompt is used to generate a detailed learning guide for a specific module.
 * It creates a comprehensive A-Z learning plan with exercises, strategies, and exam preparation.
 * 
 * VARIABLES that will be replaced:
 * - {totalHours}: Total planned learning hours for this module
 * - {moduleName}: Name of the module
 * - {ects}: ECTS credits
 * - {workload}: Total workload in hours
 */

export const MODULE_GUIDE_SYSTEM_PROMPT = `Du bist ein Elite-Lerncoach und erstellst DETAILLIERTE, ACTIONABLE Lernguides für Studenten.

Dein Ziel: Einen KOMPLETTEN A-Z Lernplan für dieses Modul erstellen, der:
- KONKRET ist (keine vagen Tipps)
- UMSETZBAR ist (klare Schritte)
- MOTIVIEREND ist (Erfolg ist machbar)
- MIT DEM LERNPLAN ABGESTIMMT ist
- ERKLÄRT wie Lernmethoden wie Spaced Repetition funktionieren und angewendet werden

DENKE WIE EIN STUDENT:
- Studenten haben begrenzte Zeit und Energie
- Größere Module (mehr ECTS) brauchen proportional MEHR Zeit und Fokus
- Studenten priorisieren nach Bewertungsgewicht - wenn ein Assessment 80% zählt, muss 80% der Energie darauf
- In den letzten Tagen vor einer Präsentation: NUR Präsentation üben, nicht Theorie lernen
- Studenten brauchen praktische, realistische Pläne, keine idealistischen "Lerne alles perfekt"-Anleitungen

WICHTIG: Viele Studenten wissen NICHT was Spaced Repetition, Active Recall, etc. bedeuten.
Erkläre diese Methoden KONKRET und zeige WIE man sie in diesem Modul anwendet!

Analysiere das Modul und erstelle einen strukturierten Guide.

WICHTIG: Antworte NUR mit einem gültigen JSON-Objekt, keine zusätzlichen Texte!`;

/**
 * User Prompt Template for Module Learning Guide
 * 
 * VARIABLES that will be replaced:
 * - {moduleName}: Name of the module
 * - {ects}: ECTS credits
 * - {workload}: Total workload in hours
 * - {totalHours}: Total planned learning hours
 * - {sessionCount}: Number of sessions in the plan
 * - {content}: Module content topics (joined by comma)
 * - {competencies}: Module competencies (joined by comma)
 * - {assessments}: List of assessments with type, weight, format, and deadline
 * - {sessionExamples}: Example sessions from the study plan
 */
export const MODULE_GUIDE_USER_PROMPT = `Erstelle einen detaillierten Lernguide für:

MODUL: {moduleName}
ECTS: {ects}
WORKLOAD: {workload} Stunden
GEPLANTE LERNZEIT: {totalHours}h ({sessionCount} Sessions im Plan)

INHALTE: {content}
KOMPETENZEN: {competencies}

PRÜFUNGEN:
{assessments}

LERNPLAN-SESSIONS (Beispiele):
{sessionExamples}

Erstelle einen JSON-Guide mit:

{
  "overview": "2-3 Sätze Überblick über das Modul",
  "competencies": ["3-5 Hauptkompetenzen die entwickelt werden"],
  "learningStrategy": {
    "method": "Hauptlernmethode (z.B. Spaced Repetition, Active Recall, Deep Work)",
    "explanation": "ERKLÄRE diese Methode so, dass ein Student der sie NICHT kennt sie versteht: Was ist es? Wie funktioniert es? Warum ist es effektiv?",
    "application": "Wie wendest du diese Methode KONKRET in DIESEM Modul an? Mit Beispielen! (z.B. 'Tag 1: Lerne Konzept X. Tag 3: Wiederhole X mit Flashcards. Tag 7: Teste dich zu X ohne Unterlagen')",
    "reasoning": "WARUM diese Methode für dieses Modul optimal ist",
    "timeline": "Wie die {totalHours}h Lernzeit optimal aufgeteilt werden (mit konkreten Stundenzahlen für Lernen, Üben, Wiederholen)"
  },
  "weeklyPlan": [
    {
      "week": 1,
      "focus": "Hauptfokus dieser Woche",
      "tasks": ["SEHR konkrete Aufgaben mit klaren Zielen, z.B. 'Erstelle 3 UML-Diagramme', 'Löse Übungen 1-10 aus Skript'"]
    }
  ],
  "exercises": ["20-30 konkrete Übungen mit Action-Items, z.B. 'Erstelle BPMN-Diagramm für Amazon-Bestellprozess', 'Implementiere Binary Search in Python'"],
  "resources": {
    "tools": ["KONKRETE Tool-Empfehlungen - Name, Link (falls bekannt), wofür genau nutzen"]
  },
  "examPrep": [
    {
      "assessmentType": "Name des Assessments (z.B. 'Schriftliche Prüfung', 'Gruppenarbeit', 'Präsentation')",
      "deadline": "YYYY-MM-DD",
      "format": "Einzelarbeit oder Gruppenarbeit",
      "weight": "Bewertungsgewicht in % - WICHTIG für Priorisierung!",
      "fourWeeks": ["Was 4 Wochen vor DIESEM Assessment tun - mit Zeitangaben (z.B. 'Investiere 10h in...'). Zeit proportional zum Gewicht!"],
      "twoWeeks": ["Was 2 Wochen vor DIESEM Assessment tun - mit Zeitangaben (z.B. 'Mindestens 15h für...'). Bei hohem Gewicht (>60%): Intensive Phase!"],
      "oneWeek": ["Was 1 Woche vor DIESEM Assessment tun - mit Zeitangaben. Bei Präsentationen: MEHRFACH ÜBEN (mindestens 3-5x vollständig durchsprechen)"],
      "lastDay": ["Letzte Vorbereitungen am Tag vor DIESEM Assessment. Bei Präsentationen: 1-2x KOMPLETT durchgehen, Timing perfektionieren, NICHT neue Folien erstellen!"]
    }
  ],
  "tips": ["10+ konkrete Lerntipps speziell für dieses Modul"],
  "commonMistakes": ["Häufige Fehler die Studenten machen"],
  "successChecklist": ["Checkliste: Bist du bereit für die Prüfung?"]
}

WICHTIG:
- Sei SPEZIFISCH (nicht "übe viel" sondern "erstelle 5 BPMN Diagramme")
- Nutze die Modulinhalte & Kompetenzen
- KRITISCH: Erstelle für JEDES Assessment (Prüfung, Gruppenarbeit, Präsentation, etc.) eine SEPARATE Vorbereitung!
- Berücksichtige den Prüfungstyp und Format (Einzelarbeit vs Gruppenarbeit) für jedes Assessment
- Bei Gruppenarbeit: Koordinations- und Teamwork-Tipps
- Bei Präsentationen: Präsentations- und Vortragstipps + IN DEN LETZTEN 3-5 TAGEN VOR PRÄSENTATION: NUR PRÄSENTIEREN ÜBEN (Vortrag halten, Timing, Folien durchgehen), KEINE neuen Inhalte lernen!
- Bei schriftlichen Prüfungen: Wiederholungs- und Testtipps
- Gib NUR Tool-Empfehlungen (keine Videos, keine Literatur - nur Tools!)
- Timeline muss zu {totalHours}h passen
- ERKLÄRE Lernmethoden so dass Studenten sie verstehen und anwenden können!
- Wochenplan muss SEHR detailliert sein mit konkreten Übungen pro Woche

MODUL-GRÖSSE BERÜCKSICHTIGEN:
- Module mit mehr ECTS sind umfangreicher und komplexer → brauchen mehr Zeit pro Woche
- {ects} ECTS bedeutet {workload} Stunden Workload
- Verteile die Zeit realistisch: Größere Module brauchen längere Sessions und mehr Wiederholungszyklen

ASSESSMENT-GEWICHTUNG PRIORISIEREN:
- Analysiere die Gewichtung (weight%) jedes Assessments
- Beispiel: 20% Prüfung + 80% Präsentation → Fokus auf Präsentation! 80% der Vorbereitungszeit für Präsentation
- Verteile Vorbereitungszeit proportional zur Bewertung
- Für Assessments mit hohem Gewicht: Früher starten, mehr Sessions einplanen, mehr Üben

ASSESSMENTS IN DIESEM MODUL:
{assessmentsList}`;
