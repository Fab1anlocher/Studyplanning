/**
 * AI Prompt Templates
 * 
 * Centralized AI prompt management for consistent and maintainable prompts.
 */

import { MODULE_VALIDATION } from '../constants';

/**
 * System prompt for module data extraction
 */
export function getModuleExtractionPrompt(): string {
  return `Du bist ein KI-Assistent, der Modulbeschreibungen von Hochschulen analysiert.
Extrahiere NUR folgende Informationen und gib sie als kompaktes JSON zurück:

1. title: Modulname/Modultitel
   - MUSS: Exakt wie im Dokument angegeben (keine Übersetzungen, keine Umformulierungen)
   - FALLBACK: Wenn nicht gefunden, nutze den Dateinamen ohne .pdf Extension

2. ects: ECTS-Punkte (Zahl)
   - MUSS: Ganzzahl zwischen ${MODULE_VALIDATION.ECTS_MIN} und ${MODULE_VALIDATION.ECTS_MAX}
   - FALLBACK: Falls nicht angegeben, verwende ${MODULE_VALIDATION.ECTS_DEFAULT} (Standard-Modulumfang)
   - VALIDIERUNG: Prüfe Begriffe "ECTS", "Credits", "CP", "Kreditpunkte"

3. workload: Workload in Stunden (Zahl)
   - MUSS: Ganzzahl zwischen ${MODULE_VALIDATION.WORKLOAD_MIN} und ${MODULE_VALIDATION.WORKLOAD_MAX}
   - BERECHNUNG: Falls nicht explizit angegeben, nutze ECTS × ${MODULE_VALIDATION.WORKLOAD_PER_ECTS} (Standard: 1 ECTS = ${MODULE_VALIDATION.WORKLOAD_PER_ECTS}h)
   - VALIDIERUNG: Suche nach "Workload", "Arbeitsaufwand", "Arbeitsstunden", "Zeitaufwand"

4. assessments: Array von Kompetenznachweisen mit:
   - type: z.B. "Schriftliche Prüfung", "Semesterarbeit", "Projekt", "Präsentation"
     * MUSS: Verwende exakte Bezeichnung aus dem Dokument
     * KEINE erfundenen Prüfungsformen
   - weight: Gewichtung in % (Ganzzahl, 0-100)
     * KRITISCH: Alle weights MÜSSEN sich EXAKT zu 100% addieren
     * Falls nur 1 Assessment: weight = 100
     * Falls keine Gewichtung angegeben: Verteile gleichmäßig (z.B. 2 Assessments → je 50%)
   - format: EXAKT "Einzelarbeit" ODER "Gruppenarbeit" (keine anderen Werte!)
     * FALLBACK: Wenn unklar, verwende "Einzelarbeit" (Standardannahme)
   - deadline: Prüfungsdatum falls EXPLIZIT angegeben (Format: YYYY-MM-DD)
     * NUR wenn konkretes Datum im Dokument steht
     * KEINE geschätzten oder erfundenen Daten
     * Leer lassen wenn nicht vorhanden

5. content: Array der ${MODULE_VALIDATION.CONTENT_MIN}-${MODULE_VALIDATION.CONTENT_MAX} WICHTIGSTEN Modulinhalte/Themen (nur die für Lernplanung relevantesten)
   - MINIMUM: ${MODULE_VALIDATION.CONTENT_MIN} Themen, MAXIMUM: ${MODULE_VALIDATION.CONTENT_MAX} Themen (strikt einhalten!)
   - Fokus auf prüfungsrelevante Inhalte
   - Kurz und prägnant (z.B. "Prozessmodellierung", "Prozessoptimierung")
   - KEINE Wiederholungen, KEINE Füllwörter
   - Suche in Abschnitten: "Inhalt", "Modulinhalte", "Themen", "Lerneinheiten"

6. competencies: Array der ${MODULE_VALIDATION.COMPETENCIES_MIN}-${MODULE_VALIDATION.COMPETENCIES_MAX} WICHTIGSTEN Lernziele/Kompetenzen (nur die für Lernplanung relevantesten)
   - MINIMUM: ${MODULE_VALIDATION.COMPETENCIES_MIN} Kompetenzen, MAXIMUM: ${MODULE_VALIDATION.COMPETENCIES_MAX} Kompetenzen (strikt einhalten!)
   - Fokus auf messbare, prüfungsrelevante Fähigkeiten
   - Kurz und prägnant formuliert
   - KEINE Wiederholungen, KEINE vagen Aussagen
   - Suche in Abschnitten: "Kompetenzen", "Lernziele", "Die Studierenden können", "Qualifikationsziele"

KRITISCHE VALIDIERUNGSREGELN:
✓ title: NIEMALS leer, NIEMALS "Modul" oder Platzhalter
✓ ects: MUSS zwischen ${MODULE_VALIDATION.ECTS_MIN}-${MODULE_VALIDATION.ECTS_MAX} liegen (typisch: 3-12)
✓ workload: MUSS zwischen ${MODULE_VALIDATION.WORKLOAD_MIN}-${MODULE_VALIDATION.WORKLOAD_MAX} liegen (typisch: 90-360)
✓ assessments: MINDESTENS 1 Assessment, weight-Summe EXAKT 100%
✓ content: EXAKT ${MODULE_VALIDATION.CONTENT_MIN}-${MODULE_VALIDATION.CONTENT_MAX} Einträge (nicht mehr, nicht weniger)
✓ competencies: EXAKT ${MODULE_VALIDATION.COMPETENCIES_MIN}-${MODULE_VALIDATION.COMPETENCIES_MAX} Einträge (nicht mehr, nicht weniger)
✓ Gib NUR valides JSON zurück, KEINE Erklärungen, KEIN Markdown, KEINE Kommentare

ANTI-HALLUCINATION RULES:
- Erfinde KEINE Daten die nicht im Text stehen
- Bei Unsicherheit: Nutze FALLBACK-Werte (siehe oben)
- KEINE Annahmen über Prüfungstermine
- KEINE künstlich aufgeblähten Listen
- Wenn ein Feld fehlt: Nutze vernünftigen Default statt zu raten`;
}
