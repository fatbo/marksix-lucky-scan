import type { DrawResult, ComparisonResult } from '../types';

const HKJC_URL = 'https://bet.hkjc.com/marksix/results.aspx?lang=en';

export async function fetchDrawResult(drawNumber: string): Promise<DrawResult | null> {
  try {
    const response = await fetch(`${HKJC_URL}&drwNo=${drawNumber.replace('/', '')}`, {
      mode: 'cors',
    });
    if (!response.ok) throw new Error('Network response not ok');
    const html = await response.text();
    return parseResultHTML(html, drawNumber);
  } catch {
    // CORS likely blocked - try with a public CORS proxy.
    // NOTE: This routes data through a third-party service. Users concerned about
    // privacy should verify results directly on the HKJC website instead.
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${HKJC_URL}&drwNo=${drawNumber.replace('/', '')}`)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Proxy response not ok');
      const html = await response.text();
      return parseResultHTML(html, drawNumber);
    } catch {
      return null;
    }
  }
}

export function parseResultHTML(html: string, drawNumber: string): DrawResult | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Try to extract winning numbers from HKJC page structure
  const numberElements = doc.querySelectorAll('.ball_no, .resultBall, [class*="ball"]');
  const numbers: number[] = [];

  numberElements.forEach((el) => {
    const num = parseInt(el.textContent?.trim() || '', 10);
    if (num >= 1 && num <= 49) {
      numbers.push(num);
    }
  });

  // Try alternative selectors
  if (numbers.length < 7) {
    const tdElements = doc.querySelectorAll('td');
    tdElements.forEach((td) => {
      const text = td.textContent?.trim() || '';
      const num = parseInt(text, 10);
      if (num >= 1 && num <= 49 && numbers.length < 7 && !numbers.includes(num)) {
        // Check if it looks like a ball number cell
        const img = td.querySelector('img');
        if (img || td.className.includes('ball') || td.className.includes('no')) {
          numbers.push(num);
        }
      }
    });
  }

  if (numbers.length < 7) return null;

  // Extract draw date
  let drawDate = '';
  const dateElements = doc.querySelectorAll('.date, [class*="date"]');
  dateElements.forEach((el) => {
    const text = el.textContent?.trim() || '';
    if (text && !drawDate) drawDate = text;
  });

  return {
    drawNumber,
    drawDate: drawDate || 'Unknown',
    winningNumbers: numbers.slice(0, 6),
    extraNumber: numbers[6],
  };
}

export function compareNumbers(
  userNumbers: number[],
  result: DrawResult,
): ComparisonResult {
  const mainNumbers = userNumbers.slice(0, 6);
  const matchedNumbers = mainNumbers.filter((n) => result.winningNumbers.includes(n));
  const extraMatched = mainNumbers.includes(result.extraNumber);
  const matchCount = matchedNumbers.length;

  let prizeCategory: string | null = null;
  let prizeTier: number | null = null;

  if (matchCount === 6) {
    prizeCategory = 'prizes.first';
    prizeTier = 1;
  } else if (matchCount === 5 && extraMatched) {
    prizeCategory = 'prizes.second';
    prizeTier = 2;
  } else if (matchCount === 5) {
    prizeCategory = 'prizes.third';
    prizeTier = 3;
  } else if (matchCount === 4 && extraMatched) {
    prizeCategory = 'prizes.fourth';
    prizeTier = 4;
  } else if (matchCount === 4) {
    prizeCategory = 'prizes.fifth';
    prizeTier = 5;
  } else if (matchCount === 3 && extraMatched) {
    prizeCategory = 'prizes.sixth';
    prizeTier = 6;
  } else if (matchCount === 3) {
    prizeCategory = 'prizes.seventh';
    prizeTier = 7;
  }

  return { matchedNumbers, extraMatched, prizeCategory, prizeTier };
}
