import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// PDF.js Worker konfigurieren
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extrahiert den vollständigen Text aus einer PDF-Datei
 * @param file - Die hochgeladene PDF-Datei
 * @returns Der extrahierte Text aus allen Seiten der PDF
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starte PDF-Extraktion für:', file.name);
    
    // Datei in ArrayBuffer konvertieren
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer erstellt, Größe:', arrayBuffer.byteLength);
    
    // PDF laden
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer
    });
    
    const pdf = await loadingTask.promise;
    console.log('PDF geladen, Seiten:', pdf.numPages);
    
    let fullText = '';
    
    // Alle Seiten durchgehen und Text extrahieren
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Text-Items zu String zusammenfügen
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
      console.log(`Seite ${pageNum} extrahiert, ${pageText.length} Zeichen`);
    }
    
    console.log('PDF-Extraktion abgeschlossen, Gesamt:', fullText.length, 'Zeichen');
    return fullText.trim();
  } catch (error) {
    console.error('Detaillierter Fehler bei PDF-Extraktion:', error);
    throw new Error(`PDF konnte nicht gelesen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}
