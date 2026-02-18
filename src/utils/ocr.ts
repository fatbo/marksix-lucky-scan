import { pipeline } from '@huggingface/transformers';
import type { ImageToTextPipeline } from '@huggingface/transformers';

export interface OcrResult {
  drawNumber: string;
  numbers: number[];
  bets: number[][];
  units: number;
  amount: number;
  rawText: string;
  confidence: number;
}

// Singleton: model is loaded once and cached for the lifetime of the page.
let _pipeline: ImageToTextPipeline | null = null;
let _pipelineLoading: Promise<ImageToTextPipeline> | null = null;

async function getOcrPipeline(
  onProgress?: (progress: number) => void,
): Promise<ImageToTextPipeline> {
  if (_pipeline) return _pipeline;
  if (_pipelineLoading) return _pipelineLoading;

  _pipelineLoading = (pipeline('image-to-text', 'microsoft/trocr-base-printed', {
    // Report download progress so the UI can show a progress bar.
    progress_callback: (p: { status: string; progress?: number }) => {
      if (onProgress && (p.status === 'downloading' || p.status === 'loading') && p.progress != null) {
        onProgress(Math.round(p.progress));
      }
    },
  }) as unknown) as Promise<ImageToTextPipeline>;

  _pipeline = await _pipelineLoading;
  _pipelineLoading = null;
  return _pipeline;
}

export async function performOCR(
  imageFile: File,
  onProgress?: (progress: number) => void,
): Promise<OcrResult> {
  const pipe = await getOcrPipeline(onProgress);

  const imageUrl = URL.createObjectURL(imageFile);
  try {
    // Signal that inference is starting (progress = 100 after model load)
    onProgress?.(100);
    const output = await pipe(imageUrl);
    const text =
      Array.isArray(output) && output[0]
        ? (output[0] as { generated_text: string }).generated_text
        : '';

    const bets = extractBets(text);
    const numbers = bets[0] ?? extractNumbers(text);

    return {
      drawNumber: extractDrawNumber(text),
      numbers,
      bets: bets.length > 0 ? bets : numbers.length > 0 ? [numbers] : [],
      units: extractUnits(text),
      amount: extractAmount(text),
      rawText: text,
      // TrOCR does not expose a confidence score; use 0 as sentinel.
      confidence: 0,
    };
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

export function extractDrawNumber(text: string): string {
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

export function extractNumbers(text: string): number[] {
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

/**
 * Extract multiple bets from OCR text.
 * Handles formats like:
 *   8+15+26+34+40+49 / 5+17+20+21+22+23
 *   or one bet per line
 */
export function extractBets(text: string): number[][] {
  const bets: number[][] = [];

  // Find bet patterns: exactly 6 numbers joined by '+' or '-'
  const betPattern = /(\d{1,2}(?:[+-]\d{1,2}){5})/g;
  const matches = text.match(betPattern);
  if (matches) {
    for (const m of matches) {
      const nums = m
        .split(/[+-]/)
        .map((n) => parseInt(n, 10))
        .filter((n) => !isNaN(n) && n >= 1 && n <= 49);
      if (nums.length >= 6) {
        bets.push(nums.slice(0, 6));
      }
    }
  }

  // If no '+'-separated bets found, fall back to extractNumbers (single bet)
  if (bets.length === 0) {
    const nums = extractNumbers(text);
    if (nums.length >= 3) {
      bets.push(nums.slice(0, 6));
    }
  }

  return bets;
}

export function extractUnits(text: string): number {
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

export function extractAmount(text: string): number {
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
