import Tesseract from 'tesseract.js';

export interface OcrResult {
  drawNumber: string;
  numbers: number[];
  units: number;
  amount: number;
  rawText: string;
  confidence: number;
}

export async function performOCR(
  imageFile: File,
  onProgress?: (progress: number) => void,
): Promise<OcrResult> {
  const result = await Tesseract.recognize(imageFile, 'eng+chi_tra', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text;
  const confidence = result.data.confidence;

  return {
    drawNumber: extractDrawNumber(text),
    numbers: extractNumbers(text),
    units: extractUnits(text),
    amount: extractAmount(text),
    rawText: text,
    confidence,
  };
}

function extractDrawNumber(text: string): string {
  // Match patterns like "26/019", "期數 26/019", "Draw No. 26/019"
  const patterns = [
    /(\d{2,4}\/\d{2,3})/,
    /期數\s*[:\s]*(\d{2,4}\/\d{2,3})/i,
    /Draw\s*(?:No\.?)?\s*[:\s]*(\d{2,4}\/\d{2,3})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function extractNumbers(text: string): number[] {
  // Look for sequences of numbers between 1-49
  const allNumbers: number[] = [];
  // Match lines with multiple 2-digit numbers
  const lines = text.split('\n');
  for (const line of lines) {
    const matches = line.match(/\b([1-9]|[1-4]\d)\b/g);
    if (matches && matches.length >= 3) {
      for (const m of matches) {
        const num = parseInt(m, 10);
        if (num >= 1 && num <= 49 && !allNumbers.includes(num)) {
          allNumbers.push(num);
        }
      }
    }
  }
  return allNumbers.slice(0, 7); // Max 7 numbers (6 + extra)
}

function extractUnits(text: string): number {
  const patterns = [
    /(\d+)\s*(?:注|Units?|Entries?)/i,
    /注數\s*[:\s]*(\d+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }
  return 1;
}

function extractAmount(text: string): number {
  const patterns = [
    /\$\s*([\d,]+(?:\.\d{1,2})?)/,
    /金額\s*[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /Amount\s*[:\s]*\$?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /HK\$\s*([\d,]+(?:\.\d{1,2})?)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseFloat(match[1].replace(/,/g, ''));
  }
  return 10;
}
