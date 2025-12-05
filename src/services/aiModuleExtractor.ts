import OpenAI from 'openai';

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
 * @param pdfText - Der extrahierte Text aus der PDF
 * @param apiKey - Der OpenAI API-Schlüssel
 * @returns Strukturierte Moduldaten
 */
export async function extractModuleDataWithAI(
  pdfText: string,
  apiKey: string
): Promise<ExtractedModuleData> {
  if (!apiKey) {
    throw new Error('API-Schlüssel fehlt');
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Nur für Development! In Production sollte dies über einen Backend-Service laufen
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
