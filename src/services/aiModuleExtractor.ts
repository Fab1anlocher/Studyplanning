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
import { getModuleExtractionPrompt } from '../lib/aiPrompts';

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
  const systemPrompt = getModuleExtractionPrompt();

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
      const totalWeight = parsedData.assessments.reduce((sum: number, a: any) => sum + (a.weight || 0), 0);
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
