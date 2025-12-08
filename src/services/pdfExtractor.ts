/**
 * PDF Text Extraction Service
 * 
 * Dieser Service extrahiert Text aus PDF-Dateien mithilfe von PDF.js.
 * Der extrahierte Text wird dann von der KI analysiert, um Moduldaten zu extrahieren.
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDF_VALIDATION } from '../constants';
import { isPDFByMagicNumber } from '../utils/validation';

// PDF.js Worker konfigurieren - erforderlich für Performance und Stabilität
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extrahiert den vollständigen Text aus einer PDF-Datei
 * 
 * Verwendet PDF.js um den Text aus allen Seiten zu extrahieren.
 * Der Text wird dann für die KI-Analyse verwendet.
 * 
 * DEFENSIVE GUARDS:
 * - Prüft auf leere/null Dateien
 * - Begrenzt maximale Dateigröße (50MB)
 * - Begrenzt maximale Seitenanzahl (200 Seiten)
 * - Validiert PDF-Format
 * 
 * @param file - Die hochgeladene PDF-Datei (File object vom Browser)
 * @returns Der extrahierte Text aus allen Seiten der PDF
 * @throws Error wenn die PDF nicht gelesen werden kann oder Limits überschreitet
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  // REVIEW: Input validation guards
  if (!file) {
    throw new Error('Keine Datei angegeben');
  }
  
  // REVIEW: File size validation (max 50MB to prevent memory issues)
  if (file.size === 0) {
    throw new Error('Die Datei ist leer (0 Bytes)');
  }
  if (file.size > PDF_VALIDATION.MAX_FILE_SIZE_BYTES) {
    throw new Error(`Die Datei ist zu groß (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: ${PDF_VALIDATION.MAX_FILE_SIZE_MB}MB`);
  }
  
  // REVIEW: File type validation with magic number check (more secure than MIME type alone)
  if (!file.type || file.type !== 'application/pdf') {
    throw new Error(`Ungültiger Dateityp: ${file.type || 'unbekannt'}. Nur PDF-Dateien werden unterstützt.`);
  }
  
  // Additional security: Validate PDF magic number (header bytes)
  const isValidPDF = await isPDFByMagicNumber(file);
  if (!isValidPDF) {
    throw new Error('Die Datei ist keine gültige PDF (fehlerhafter Header). Bitte verwende eine echte PDF-Datei.');
  }
  
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
    
    // REVIEW: Page count validation (max 200 pages to prevent excessive processing)
    if (pdf.numPages === 0) {
      throw new Error('Die PDF enthält keine Seiten');
    }
    if (pdf.numPages > PDF_VALIDATION.MAX_PAGES) {
      console.warn(`PDF hat ${pdf.numPages} Seiten (max: ${PDF_VALIDATION.MAX_PAGES}). Verarbeite nur erste ${PDF_VALIDATION.MAX_PAGES} Seiten.`);
    }
    const pagesToProcess = Math.min(pdf.numPages, PDF_VALIDATION.MAX_PAGES);
    
    // Alle Seiten parallel verarbeiten für bessere Performance
    const pagePromises = [];
    for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
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
    
    // REVIEW: Validate extracted text is not empty
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('Kein Text in der PDF gefunden. Die PDF könnte verschlüsselt, gescannt oder beschädigt sein.');
    }
    
    // REVIEW: Warn if text seems too short (might indicate extraction issues)
    if (fullText.trim().length < PDF_VALIDATION.MIN_TEXT_LENGTH) {
      console.warn(`Extrahierter Text ist sehr kurz (<${PDF_VALIDATION.MIN_TEXT_LENGTH} Zeichen). Prüfe ob die PDF korrekt ist.`);
    }
    
    console.log('PDF-Extraktion abgeschlossen, Gesamt:', fullText.length, 'Zeichen');
    return fullText.trim();
  } catch (error) {
    console.error('Detaillierter Fehler bei PDF-Extraktion:', error);
    throw new Error(`PDF konnte nicht gelesen werden: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
  }
}
