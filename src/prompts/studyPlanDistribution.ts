/**
 * PROMPT 1 - Study Plan Module Distribution
 * 
 * Input: Empty slots (date/time from frontend) + module metadata
 * Output: Sessions with modules intelligently distributed
 * Task: ONLY module assignment logic (ECTS, deadlines, workload balance)
 * 
 * VARIABLES that will be replaced:
 * - {slots}: JSON array of empty slots (date, startTime, endTime, module: null)
 * - {planningData}: JSON with modules (name, ECTS, workload, deadlines, content)
 */

export const STUDY_PLAN_DISTRIBUTION_PROMPT = `Du bist ein Planungs-Intelligenz. Verteile Module auf vordefinierten Slots intelligent und fair.

EINGABE 1 - Leere Slots (vom Frontend expandiert):
{slots}

EINGABE 2 - Module mit Metadaten:
{planningData}

═══════════════════════════════════════════════════════════════════

AUFGABE:

Für JEDEN leeren Slot: Weise ein Modul zu (intelligente Verteilung)

VERTEILUNGS-LOGIK:
✓ Höheres ECTS → mehr Slots für dieses Modul
✓ Nach lastDeadline → keine neuen Slots
✓ Workload ausgleichen über alle Module
✓ In letzten 2 Wochen vor Deadline: Fokus auf Wiederholung
✓ Wechsel zwischen Modulen (Interleaving) für bessere Retention

═══════════════════════════════════════════════════════════════════

REGELN:

1. MODULE-ZUWEISUNG:
   ✓ KOPIERE ALLE Felder aus Slot (date, startTime, endTime)
   ✓ Ersetze module: null → module: "Modulname"
   ✓ Jeder Slot MUSS ein Modul bekommen!

2. INTELLIGENTE VERTEILUNG:
   ✓ Berechne Slots-pro-Modul basierend auf ECTS-Anteil
   ✓ Respektiere lastDeadline: Nach Deadline = kein neuer Slot
   ✓ Vertei Workload proportional zu ECTS
   ✓ Keine ungleichen Verteilungen

3. QUALITÄT:
   ✓ Wechsel zwischen verschiedenen Modulen (nicht 5x gleich)
   ✓ Später Slots für gleiche Module spacing (nicht direkt hintereinander)

═══════════════════════════════════════════════════════════════════

AUSGABEFORMAT (JSON):

{
  "sessions": [
    {
      "date": "2025-12-15",
      "startTime": "09:00",
      "endTime": "11:00",
      "module": "EMPR - Moderne Programmierung in R - BWWh024"
    },
    {
      "date": "2025-12-19",
      "startTime": "14:00",
      "endTime": "16:00",
      "module": "Grundlagen BWL"
    },
    ... (ALLE Slots mit Modulen!)
  ],
  "summary": {
    "totalSessions": 80,
    "moduleDistribution": {
      "Modul1": 20,
      "Modul2": 15
    }
  }
}

═══════════════════════════════════════════════════════════════════

Verteile JETZT die Module auf die Slots!`;
