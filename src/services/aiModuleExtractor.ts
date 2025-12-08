/**
 * KI-basierte Modul-Datenextraktion
 * 
 * Dieser Service verwendet die OpenAI API um strukturierte Daten aus 
 * PDF-Modulbeschreibungen zu extrahieren. Die KI analysiert den Text
 * und gibt ein strukturiertes JSON-Objekt mit Moduldaten zurück.
 */

import OpenAI from 'openai';

/**
 * Strukturierte Modul-Daten die von der KI extrahiert werden
 */
export interface ExtractedModuleData {
  title: string;
  ects: number;
  workload: number;
  assessments: {
    type: string;
    weight: number;
    format: string;
  }[];
  content?: string[];  // Inhalte/Themen des Moduls
  competencies?: string[];  // Lernziele/Kompetenzen
}

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
   - MUSS: Ganzzahl zwischen 1 und 30
   - FALLBACK: Falls nicht angegeben, verwende 6 (Standard-Modulumfang)
   - VALIDIERUNG: Prüfe Begriffe "ECTS", "Credits", "CP", "Kreditpunkte"

3. workload: Workload in Stunden (Zahl)
   - MUSS: Ganzzahl zwischen 30 und 900
   - BERECHNUNG: Falls nicht explizit angegeben, nutze ECTS × 30 (Standard: 1 ECTS = 30h)
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

5. content: Array der 4-6 WICHTIGSTEN Modulinhalte/Themen (nur die für Lernplanung relevantesten)
   - MINIMUM: 4 Themen, MAXIMUM: 6 Themen (strikt einhalten!)
   - Fokus auf prüfungsrelevante Inhalte
   - Kurz und prägnant (z.B. "Prozessmodellierung", "Prozessoptimierung")
   - KEINE Wiederholungen, KEINE Füllwörter
   - Suche in Abschnitten: "Inhalt", "Modulinhalte", "Themen", "Lerneinheiten"

6. competencies: Array der 3-5 WICHTIGSTEN Lernziele/Kompetenzen (nur die für Lernplanung relevantesten)
   - MINIMUM: 3 Kompetenzen, MAXIMUM: 5 Kompetenzen (strikt einhalten!)
   - Fokus auf messbare, prüfungsrelevante Fähigkeiten
   - Kurz und prägnant formuliert
   - KEINE Wiederholungen, KEINE vagen Aussagen
   - Suche in Abschnitten: "Kompetenzen", "Lernziele", "Die Studierenden können", "Qualifikationsziele"

KRITISCHE VALIDIERUNGSREGELN:
✓ title: NIEMALS leer, NIEMALS "Modul" oder Platzhalter
✓ ects: MUSS zwischen 1-30 liegen (typisch: 3-12)
✓ workload: MUSS zwischen 30-900 liegen (typisch: 90-360)
✓ assessments: MINDESTENS 1 Assessment, weight-Summe EXAKT 100%
✓ content: EXAKT 4-6 Einträge (nicht mehr, nicht weniger)
✓ competencies: EXAKT 3-5 Einträge (nicht mehr, nicht weniger)
✓ Gib NUR valides JSON zurück, KEINE Erklärungen, KEIN Markdown, KEINE Kommentare

ANTI-HALLUCINATION RULES:
- Erfinde KEINE Daten die nicht im Text stehen
- Bei Unsicherheit: Nutze FALLBACK-Werte (siehe oben)
- KEINE Annahmen über Prüfungstermine
- KEINE künstlich aufgeblähten Listen
- Wenn ein Feld fehlt: Nutze vernünftigen Default statt zu raten`;

  try {
    // Text auf 12.000 Zeichen begrenzen für schnellere Verarbeitung
    // Wichtige Infos (ECTS, Kompetenznachweis, etc.) stehen meist am Anfang
    const truncatedText = pdfText.length > 12000 
      ? pdfText.substring(0, 12000) + '...'
      : pdfText;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Günstiges aber leistungsfähiges Modell
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Modulbeschreibung:\n\n${truncatedText}` }
      ],
      temperature: 0.1, // Niedrige Temperature für konsistentere Ergebnisse
      response_format: { type: 'json_object' },
      max_tokens: 1000 // Reduziertes Token-Limit für schnellere Response
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von der KI erhalten');
    }

    const parsedData = JSON.parse(content);
    
    // REVIEW: Enhanced validation with specific error messages and boundary checks
    // Validate title
    if (!parsedData.title || parsedData.title.trim().length === 0) {
      throw new Error('Kein Modultitel extrahiert. PDF möglicherweise unlesbar oder formatiert.');
    }
    
    // REVIEW: Validate ECTS range (typical university modules: 1-30 ECTS)
    if (!parsedData.ects || parsedData.ects < 1 || parsedData.ects > 30) {
      console.warn(`ECTS außerhalb des normalen Bereichs: ${parsedData.ects}. Setze auf 6 (Standard).`);
      parsedData.ects = 6; // Fallback to typical module size
    }
    
    // REVIEW: Validate workload range (typical: 30h per ECTS, max 900h for 30 ECTS)
    if (!parsedData.workload || parsedData.workload < 30 || parsedData.workload > 900) {
      console.warn(`Workload außerhalb des normalen Bereichs: ${parsedData.workload}h. Berechne aus ECTS.`);
      parsedData.workload = parsedData.ects * 30; // Fallback: Standard calculation
    }
    
    // REVIEW: Validate assessments exist and weights sum to 100%
    if (!parsedData.assessments || !Array.isArray(parsedData.assessments) || parsedData.assessments.length === 0) {
      throw new Error('Keine Prüfungen/Assessments gefunden. Bitte prüfe die Modulbeschreibung.');
    }
    
    // REVIEW: Critical validation - assessment weights must sum to 100%
    const totalWeight = parsedData.assessments.reduce((sum, a) => sum + (a.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > 0.1) { // Allow 0.1% tolerance for rounding
      console.warn(`Assessment-Gewichtungen addieren sich zu ${totalWeight}% statt 100%. Normalisiere...`);
      // Normalize weights to sum to 100%
      const factor = 100 / totalWeight;
      parsedData.assessments = parsedData.assessments.map(a => ({
        ...a,
        weight: Math.round(a.weight * factor)
      }));
    }
    
    // REVIEW: Validate content array size (4-6 items as specified in prompt)
    if (!parsedData.content || !Array.isArray(parsedData.content)) {
      console.warn('Keine Modulinhalte extrahiert. Setze leeres Array.');
      parsedData.content = [];
    } else if (parsedData.content.length < 4 || parsedData.content.length > 6) {
      console.warn(`Content-Array hat ${parsedData.content.length} Einträge (erwartet: 4-6). Begrenze...`);
      parsedData.content = parsedData.content.slice(0, 6); // Take max 6
    }
    
    // REVIEW: Validate competencies array size (3-5 items as specified in prompt)
    if (!parsedData.competencies || !Array.isArray(parsedData.competencies)) {
      console.warn('Keine Kompetenzen extrahiert. Setze leeres Array.');
      parsedData.competencies = [];
    } else if (parsedData.competencies.length < 3 || parsedData.competencies.length > 5) {
      console.warn(`Competencies-Array hat ${parsedData.competencies.length} Einträge (erwartet: 3-5). Begrenze...`);
      parsedData.competencies = parsedData.competencies.slice(0, 5); // Take max 5
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
