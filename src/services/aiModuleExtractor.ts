/**
 * KI-basierte Modul-Datenextraktion
 * 
 * Dieser Service verwendet die OpenAI API um strukturierte Daten aus 
 * PDF-Modulbeschreibungen zu extrahieren. Die KI analysiert den Text
 * und gibt ein strukturiertes JSON-Objekt mit Moduldaten zurück.
 */

import OpenAI from 'openai';
import { MODULE_EXTRACTION_SYSTEM_PROMPT } from '../prompts/moduleExtractionPrompt';

// REVIEW: Constants for validation
const ECTS_MIN = 1;
const ECTS_MAX = 30;
const ECTS_DEFAULT = 6; // Standard module size
const WORKLOAD_MIN = 30; // 1 ECTS minimum
const WORKLOAD_MAX = 900; // 30 ECTS maximum
const WORKLOAD_PER_ECTS = 30; // European standard: 1 ECTS = 30 hours
const ASSESSMENT_WEIGHT_TOLERANCE = 0.1; // Allow 0.1% rounding error
const CONTENT_MIN = 4;
const CONTENT_MAX = 6;
const COMPETENCIES_MIN = 3;
const COMPETENCIES_MAX = 5;

/**
 * Ensures assessment weights sum to exactly 100% using largest remainder method
 * This prevents rounding errors from causing weight sums != 100%
 * @param assessments - Array of assessments with weights
 * @returns Normalized assessments with weights summing to exactly 100%
 */
function normalizeAssessmentWeights(assessments: Array<{ weight: number; [key: string]: any }>): typeof assessments {
  const total = assessments.reduce((sum, a) => sum + a.weight, 0);
  
  // REVIEW: Guard against zero or negative totals
  if (total <= 0) {
    console.warn('Assessment weights sum to zero or negative. Setting equal weights.');
    const equalWeight = Math.floor(100 / assessments.length);
    const remainder = 100 - (equalWeight * assessments.length);
    return assessments.map((a, i) => ({
      ...a,
      weight: i < remainder ? equalWeight + 1 : equalWeight
    }));
  }
  
  if (Math.abs(total - 100) < ASSESSMENT_WEIGHT_TOLERANCE) {
    return assessments; // Already close enough
  }
  
  // Calculate ideal weights and integer parts
  const factor = 100 / total;
  const idealWeights = assessments.map(a => a.weight * factor);
  const integerParts = idealWeights.map(w => Math.floor(w));
  const fractionalParts = idealWeights.map((w, i) => ({ index: i, fraction: w - integerParts[i] }));
  
  // Sort by fractional part descending
  fractionalParts.sort((a, b) => b.fraction - a.fraction);
  
  // Distribute remaining points to largest remainders
  let distributed = integerParts.reduce((sum, w) => sum + w, 0);
  let i = 0;
  while (distributed < 100 && i < fractionalParts.length) {
    integerParts[fractionalParts[i].index]++;
    distributed++;
    i++;
  }
  
  return assessments.map((a, index) => ({
    ...a,
    weight: integerParts[index]
  }));
}

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

  try {
    // Text auf 12.000 Zeichen begrenzen für schnellere Verarbeitung
    const truncatedText = pdfText.length > 12000 
      ? pdfText.substring(0, 12000) + '...'
      : pdfText;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Günstiges aber leistungsfähiges Modell
      messages: [
        { role: 'system', content: MODULE_EXTRACTION_SYSTEM_PROMPT },
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
    // Use explicit null check to allow 0 to be caught by range validation
    if (parsedData.ects == null || typeof parsedData.ects !== 'number' || parsedData.ects < ECTS_MIN || parsedData.ects > ECTS_MAX) {
      console.warn(`ECTS außerhalb des normalen Bereichs: ${parsedData.ects}. Setze auf ${ECTS_DEFAULT} (Standard).`);
      parsedData.ects = ECTS_DEFAULT;
    }
    
    // REVIEW: Validate workload range (typical: 30h per ECTS, max 900h for 30 ECTS)
    if (parsedData.workload == null || typeof parsedData.workload !== 'number' || parsedData.workload < WORKLOAD_MIN || parsedData.workload > WORKLOAD_MAX) {
      console.warn(`Workload außerhalb des normalen Bereichs: ${parsedData.workload}h. Berechne aus ECTS.`);
      parsedData.workload = parsedData.ects * WORKLOAD_PER_ECTS;
    }
    
    // REVIEW: Validate assessments exist and weights sum to 100%
    if (!parsedData.assessments || !Array.isArray(parsedData.assessments) || parsedData.assessments.length === 0) {
      throw new Error('Keine Prüfungen/Assessments gefunden. Bitte prüfe die Modulbeschreibung.');
    }
    
    // REVIEW: Critical validation - assessment weights must sum to 100% (using largest remainder method)
    const totalWeight = parsedData.assessments.reduce((sum, a) => sum + (a.weight || 0), 0);
    if (Math.abs(totalWeight - 100) > ASSESSMENT_WEIGHT_TOLERANCE) {
      console.warn(`Assessment-Gewichtungen addieren sich zu ${totalWeight}% statt 100%. Normalisiere mit Largest Remainder Method...`);
      parsedData.assessments = normalizeAssessmentWeights(parsedData.assessments);
    }
    
    // REVIEW: Validate content array size (4-6 items as specified in prompt)
    if (!parsedData.content || !Array.isArray(parsedData.content)) {
      console.warn('Keine Modulinhalte extrahiert. Setze leeres Array.');
      parsedData.content = [];
    } else if (parsedData.content.length < CONTENT_MIN || parsedData.content.length > CONTENT_MAX) {
      console.warn(`Content-Array hat ${parsedData.content.length} Einträge (erwartet: ${CONTENT_MIN}-${CONTENT_MAX}). Begrenze...`);
      parsedData.content = parsedData.content.slice(0, CONTENT_MAX);
    }
    
    // REVIEW: Validate competencies array size (3-5 items as specified in prompt)
    if (!parsedData.competencies || !Array.isArray(parsedData.competencies)) {
      console.warn('Keine Kompetenzen extrahiert. Setze leeres Array.');
      parsedData.competencies = [];
    } else if (parsedData.competencies.length < COMPETENCIES_MIN || parsedData.competencies.length > COMPETENCIES_MAX) {
      console.warn(`Competencies-Array hat ${parsedData.competencies.length} Einträge (erwartet: ${COMPETENCIES_MIN}-${COMPETENCIES_MAX}). Begrenze...`);
      parsedData.competencies = parsedData.competencies.slice(0, COMPETENCIES_MAX);
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
