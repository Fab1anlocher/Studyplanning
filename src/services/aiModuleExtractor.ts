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

  const systemPrompt = `Du bist ein KI-Assistent, der Modulbeschreibungen von Hochschulen analysiert.
Extrahiere NUR folgende Informationen und gib sie als kompaktes JSON zurück:

1. title: Modulname/Modultitel
2. ects: ECTS-Punkte (Zahl)
3. workload: Workload in Stunden (Zahl, falls nicht angegeben: ECTS × 30)
4. assessments: Array von Kompetenznachweisen mit:
   - type: z.B. "Schriftliche Prüfung", "Semesterarbeit", "Projekt", "Präsentation"
   - weight: Gewichtung in % (Zahl)
   - format: "Einzelarbeit" oder "Gruppenarbeit"
   - deadline: Prüfungsdatum falls angegeben (Format: YYYY-MM-DD)
5. content: Array der 4-6 WICHTIGSTEN Modulinhalte/Themen (nur die für Lernplanung relevantesten)
6. competencies: Array der 3-5 WICHTIGSTEN Lernziele/Kompetenzen (nur die für Lernplanung relevantesten)

Suche gezielt nach den Abschnitten:
- "Kompetenznachweis" oder "Prüfung" für assessments
- "ECTS" oder "Credits" für Punkte
- "Workload" oder "Arbeitsaufwand" für Stunden
- "Inhalt" oder "Modulinhalte" oder "Themen" für content
- "Kompetenzen" oder "Lernziele" oder "Die Studierenden können" für competencies

Wichtig für content:
- NUR 4-6 Hauptthemen (keine vollständige Auflistung)
- Fokus auf prüfungsrelevante Inhalte
- Kurz und prägnant (z.B. "Prozessmodellierung", "Prozessoptimierung")

Wichtig für competencies:
- NUR 3-5 Hauptkompetenzen (keine vollständige Liste)
- Fokus auf messbare, prüfungsrelevante Fähigkeiten
- Kurz und prägnant formuliert

Wichtig:
- Gewichtungen müssen sich zu 100% addieren
- Falls nur eine Prüfung: weight = 100
- Gib NUR valides JSON zurück, keine Erklärungen`;

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
