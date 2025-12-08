/**
 * KI-basierte Modul-Datenextraktion
 * 
 * Dieser Service verwendet die OpenAI API um strukturierte Daten aus 
 * PDF-Modulbeschreibungen zu extrahieren. Die KI analysiert den Text
 * und gibt ein strukturiertes JSON-Objekt mit Moduldaten zurück.
 */

import OpenAI from 'openai';
import { ExtractedModuleData } from '../types';
import { MODULE_VALIDATION, AI_CONFIG } from '../constants';
import { 
  isValidECTS, 
  isValidWorkload, 
  validateAssessmentWeights,
  isValidModuleTitle,
  isValidContentArray,
  isValidCompetenciesArray 
} from '../utils/validation';
import { 
  normalizeAssessmentWeights, 
  calculateWorkloadFromECTS, 
  truncateText 
} from '../utils/helpers';

/**
 * Extrahiert strukturierte Daten aus dem PDF-Text mithilfe von OpenAI
 * 
 * Diese Funktion sendet den PDF-Text an die OpenAI API (GPT-4o-mini)
 * und lässt die KI die relevanten Informationen extrahieren.
 * 
 * @param pdfText - Der extrahierte Text aus der PDF-Datei
 * @param apiKey - Der OpenAI API-Schlüssel des Benutzers
 * @returns Strukturierte Moduldaten (Titel, ECTS, Workload, Assessments)
 * @throws Error wenn der API-Key ungültig ist oder die KI-Anfrage fehlschlägt
 */
export async function extractModuleDataWithAI(
  pdfText: string,
  apiKey: string
): Promise<ExtractedModuleData> {
  if (!apiKey) {
    throw new Error('API-Schlüssel fehlt');
  }

  // OpenAI Client initialisieren
  // WICHTIG: dangerouslyAllowBrowser sollte nur in Development verwendet werden
  // In Production sollte dies über einen Backend-Service laufen
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  // REVIEW: Prompt Hardening - Added explicit constraints and validation rules to reduce hallucinations
  const systemPrompt = `Du bist ein KI-Assistent, der Modulbeschreibungen von Hochschulen analysiert.
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

  try {
    // Text auf max. Länge begrenzen für schnellere Verarbeitung
    // Wichtige Infos (ECTS, Kompetenznachweis, etc.) stehen meist am Anfang
    const truncatedText = truncateText(pdfText, AI_CONFIG.MAX_TEXT_LENGTH);
    
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Modulbeschreibung:\n\n${truncatedText}` }
      ],
      temperature: AI_CONFIG.TEMPERATURE,
      response_format: { type: 'json_object' },
      max_tokens: AI_CONFIG.MAX_TOKENS
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von der KI erhalten');
    }

    const parsedData = JSON.parse(content);
    
    // REVIEW: Enhanced validation with specific error messages and boundary checks
    // Validate title
    if (!isValidModuleTitle(parsedData.title)) {
      throw new Error('Kein Modultitel extrahiert. PDF möglicherweise unlesbar oder formatiert.');
    }
    
    // REVIEW: Validate ECTS range (typical university modules: 1-30 ECTS)
    if (!isValidECTS(parsedData.ects)) {
      console.warn(`ECTS außerhalb des normalen Bereichs: ${parsedData.ects}. Setze auf ${MODULE_VALIDATION.ECTS_DEFAULT} (Standard).`);
      parsedData.ects = MODULE_VALIDATION.ECTS_DEFAULT;
    }
    
    // REVIEW: Validate workload range (typical: 30h per ECTS, max 900h for 30 ECTS)
    if (!isValidWorkload(parsedData.workload)) {
      console.warn(`Workload außerhalb des normalen Bereichs: ${parsedData.workload}h. Berechne aus ECTS.`);
      parsedData.workload = calculateWorkloadFromECTS(parsedData.ects);
    }
    
    // REVIEW: Validate assessments exist and weights sum to 100%
    if (!parsedData.assessments || !Array.isArray(parsedData.assessments) || parsedData.assessments.length === 0) {
      throw new Error('Keine Prüfungen/Assessments gefunden. Bitte prüfe die Modulbeschreibung.');
    }
    
    // REVIEW: Critical validation - assessment weights must sum to 100%
    if (!validateAssessmentWeights(parsedData.assessments)) {
      const totalWeight = parsedData.assessments.reduce((sum, a) => sum + (a.weight || 0), 0);
      console.warn(`Assessment-Gewichtungen addieren sich zu ${totalWeight}% statt 100%. Normalisiere mit Largest Remainder Method...`);
      parsedData.assessments = normalizeAssessmentWeights(parsedData.assessments);
    }
    
    // REVIEW: Validate content array size
    if (!parsedData.content || !Array.isArray(parsedData.content)) {
      console.warn('Keine Modulinhalte extrahiert. Setze leeres Array.');
      parsedData.content = [];
    } else if (!isValidContentArray(parsedData.content)) {
      console.warn(`Content-Array hat ${parsedData.content.length} Einträge (erwartet: ${MODULE_VALIDATION.CONTENT_MIN}-${MODULE_VALIDATION.CONTENT_MAX}). Begrenze...`);
      parsedData.content = parsedData.content.slice(0, MODULE_VALIDATION.CONTENT_MAX);
    }
    
    // REVIEW: Validate competencies array size
    if (!parsedData.competencies || !Array.isArray(parsedData.competencies)) {
      console.warn('Keine Kompetenzen extrahiert. Setze leeres Array.');
      parsedData.competencies = [];
    } else if (!isValidCompetenciesArray(parsedData.competencies)) {
      console.warn(`Competencies-Array hat ${parsedData.competencies.length} Einträge (erwartet: ${MODULE_VALIDATION.COMPETENCIES_MIN}-${MODULE_VALIDATION.COMPETENCIES_MAX}). Begrenze...`);
      parsedData.competencies = parsedData.competencies.slice(0, MODULE_VALIDATION.COMPETENCIES_MAX);
    }

    return parsedData as ExtractedModuleData;
  } catch (error) {
    console.error('Fehler bei der KI-Extraktion:', error);
    
    if (error instanceof Error) {
      // Spezifische Fehlermeldungen für häufige Probleme
      if (error.message.includes('API key')) {
        throw new Error('Ungültiger API-Schlüssel. Bitte überprüfe deinen OpenAI API-Key.');
      }
      if (error.message.includes('quota')) {
        throw new Error('API-Limit erreicht. Bitte überprüfe dein OpenAI-Konto.');
      }
      throw error;
    }
    
    throw new Error('KI-Extraktion fehlgeschlagen');
  }
}

/**
 * Verarbeitet eine PDF-Datei komplett: Extrahiert Text und analysiert ihn mit KI
 * @param file - Die hochgeladene PDF-Datei
 * @param pdfText - Der bereits extrahierte PDF-Text
 * @param apiKey - Der OpenAI API-Schlüssel
 * @returns Vollständige Moduldaten inkl. Rohtext
 */
export async function processModulePDF(
  file: File,
  pdfText: string,
  apiKey: string
): Promise<{
  moduleData: ExtractedModuleData;
  extractedContent: string;
  pdfName: string;
}> {
  const moduleData = await extractModuleDataWithAI(pdfText, apiKey);
  
  return {
    moduleData,
    extractedContent: pdfText,
    pdfName: file.name
  };
}
