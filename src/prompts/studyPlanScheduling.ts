/**
 * PROMPT 2 - Study Plan Content Details
 * 
 * Input: Sessions with modules assigned from PROMPT 1 + module content/competencies
 * Output: Sessions with topic/description/learningMethod added
 * Task: ONLY content enrichment (no module changes!)
 * 
 * VARIABLES that will be replaced:
 * - {planningData}: JSON with modules (content, competencies, assessments)
 * - {sessions}: JSON output from PROMPT 1 (sessions with module assigned)
 */

export const STUDY_PLAN_SCHEDULING_PROMPT = `Du bist ein Lern-Content-Designer. Füge Lerndetails zu Slots hinzu.

EINGABE 1 - Modulinformationen (Content & Kompetenzen):
{planningData}

EINGABE 2 - Sessions mit Modulen (aus Schritt 1):
{sessions}

═══════════════════════════════════════════════════════════════════

AUFGABE: 
1. KOPIERE alle Felder (date, startTime, endTime, module)
2. Füge hinzu: topic, description, learningMethod (NICHTS MEHR!)

REGELN:

1. NICHT ÄNDERN:
   ✓ date, startTime, endTime: EXAKT kopieren
   ✓ module: NICHT ÄNDERN
   ✓ Keine Filter, kein Reordering!

2. TOPIC-BESTIMMUNG:
   ✓ Welche Position hat dieser Slot im Modul-Timeline?
   ✓ Early (erste 30%): "Grundlagen: [Thema aus content]"
   ✓ Middle (30-70%): "Vertiefung: [Thema aus content]"
   ✓ Late (letzte 30%): "Wiederholung & Prüfungsvorbereitung"

3. LERNMETHODE (basierend auf Prüfungs-Nähe zum slot.date):
   ✓ 6+ Wochen: Deep Work, Active Recall
   ✓ 4-6 Wochen: Spaced Repetition
   ✓ 2-4 Wochen: Practice Testing
   ✓ 1-2 Wochen: Active Recall, Practice Testing
   ✓ < 1 Woche: Practice Testing

4. DESCRIPTION:
   ✓ Konkret: "Löse Aufgaben 1-5 zu X" nicht "Lerne X"
   ✓ Aus planningData.modules[X].content
   ✓ Max 2 Sätze
   

═══════════════════════════════════════════════════════════════════

LERNMETHODEN-LISTE (verwende NUR diese):
- "Deep Work": Fokussierte 2-4h Sessions auf einen Thema
- "Spaced Repetition": Regelmässige Wiederholungen in Abständen
- "Active Recall": Selbsttests, Aufgaben lösen, Memory
- "Practice Testing": Prüfungssimulation, alte Aufgaben
- "Pomodoro": 25min Fokus + 5min Pause Zyklen
- "Feynman Technik": Konzept erklären, Lücken aufdecken

═══════════════════════════════════════════════════════════════════

AUSGABEFORMAT (JSON):

{
  "sessions": [
    {
      "date": "2025-12-16",
      "startTime": "09:00",
      "endTime": "11:00",
      "module": "Modulname",
      "topic": "Grundlagen: [spezifisches Thema]",
      "description": "Konkrete Aufgabe (z.B. 'Löse Übungen 1-3 zu X, erstelle Zusammenfassung')",
      "learningMethod": "Deep Work"
    }
  ],
  "summary": {
    "totalSessions": 50,
    "totalHours": 100,
    "moduleDistribution": { "Modul1": 25, "Modul2": 30 },
    "methodDistribution": { "Deep Work": 15, "Spaced Repetition": 20 }
  }
}

═══════════════════════════════════════════════════════════════════

WICHTIG:
✓ KOPIERE alle Sessions (keine Änderung an date/time/module!)
✓ NUR hinzufügen: topic, description, learningMethod
✓ Alle Methoden aus der Liste
✓ KEINE neuen Sessions, KEINE gefilterten Sessions

Füge JETZT details zu ALLEN Sessions hinzu!`;
