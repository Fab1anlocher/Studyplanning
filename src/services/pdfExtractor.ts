/**
 * PDF Text Extraction Service
 * 
 * Dieser Service extrahiert Text aus PDF-Dateien mithilfe von PDF.js.
 * Der extrahierte Text wird dann von der KI analysiert, um Moduldaten zu extrahieren.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// PDF.js Worker konfigurieren - erforderlich für Performance und Stabilität
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extrahiert den vollständigen Text aus einer PDF-Datei
 * 
 * Verwendet PDF.js um den Text aus allen Seiten zu extrahieren.
 * Der Text wird dann für die KI-Analyse verwendet.
 * 
 * @param file - Die hochgeladene PDF-Datei (File object vom Browser)
 * @returns Der extrahierte Text aus allen Seiten der PDF
 * @throws Error wenn die PDF nicht gelesen werden kann
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starte PDF-Extraktion für:', file.name);
    
    // Datei in ArrayBuffer konvertieren - erforderlich für PDF.js
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer erstellt, Größe:', arrayBuffer.byteLength);
    
    // PDF laden - erstellt ein PDF-Dokument-Objekt
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF geladen, Seiten:', pdf.numPages);
    
    // Alle Seiten parallel verarbeiten für bessere Performance
    const pagePromises = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      pagePromises.push(
        pdf.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          console.log(`Seite ${pageNum} extrahiert, ${pageText.length} Zeichen`);
          return pageText;
        })
      );
    }
    
    // Alle Seiten gleichzeitig verarbeiten
    const pageTexts = await Promise.all(pagePromises);
    const fullText = pageTexts.join('\n\n');
    
    console.log('PDF-Extraktion abgeschlossen, Gesamt:', fullText.length, 'Zeichen');
    return fullText.trim();
  } catch (error) {
    console.error('Detaillierter Fehler bei PDF-Extraktion:', error);
    throw new Error(`PDF konnte nicht gelesen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}
