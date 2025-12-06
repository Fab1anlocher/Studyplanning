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

  const systemPrompt = `Du bist ein KI-Assistent, der Modulbeschreibungen von Hochschulen analysiert.
Extrahiere folgende Informationen aus dem Text und gib sie als JSON zurück:

1. title: Der vollständige Titel des Moduls
2. ects: Die Anzahl der ECTS-Punkte (als Zahl)
3. workload: Der Workload in Stunden (als Zahl)
4. assessments: Ein Array von Leistungsnachweisen mit:
   - type: Art des Nachweises (z.B. "Schriftliche Prüfung", "Semesterarbeit", "Projekt", "Präsentation", "Reflexion", "Mündliche Prüfung")
   - weight: Gewichtung in Prozent (als Zahl)
   - format: "Einzelarbeit" oder "Gruppenarbeit"

Achte besonders auf:
- ECTS-Punkte können auch als "Credits" bezeichnet werden
- Workload kann aus ECTS berechnet werden (1 ECTS = 25-30 Stunden)
- Leistungsnachweise können verschiedene Namen haben (Kompetenznachweis, Prüfung, Assessment, etc.)
- Die Gewichtungen sollten sich zu 100% aufaddieren

Gib NUR das JSON-Objekt zurück, ohne zusätzlichen Text oder Markdown-Formatierung.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Günstiges aber leistungsfähiges Modell
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analysiere diese Modulbeschreibung:\n\n${pdfText}` }
      ],
      temperature: 0.1, // Niedrige Temperature für konsistentere Ergebnisse
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Keine Antwort von der KI erhalten');
    }

    const parsedData = JSON.parse(content);
    
    // Validierung der extrahierten Daten
    if (!parsedData.title || !parsedData.ects || !parsedData.workload) {
      throw new Error('Unvollständige Daten von der KI erhalten');
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
