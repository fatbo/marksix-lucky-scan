import type { DrawResult, ComparisonResult } from '../types';

const HKJC_JSON_BASE = 'https://bet.hkjc.com/marksix/getJSON.aspx?ls=1&js=1';
const CACHE_KEY = 'lastMarkSixResults';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface CachedResult {
  data: DrawResult;
  timestamp: number;
}

function buildHkjcUrl(date?: string): string {
  if (!date) return HKJC_JSON_BASE;
  // Convert YYYY-MM-DD to dd/mm/yyyy
  const [y, m, d] = date.split('-');
  return `${HKJC_JSON_BASE}&date=${d}/${m}/${y}`;
}

function wrapWithProxy(url: string): string {
  return `https://corsproxy.io/?${encodeURIComponent(url)}`;
}

export function parseHkjcJson(raw: string): DrawResult | null {
  // The HKJC endpoint returns a JS-like array/object; strip any leading variable assignment
  let json = raw.trim();
  // Remove JS variable assignment prefix (e.g. "var data=") and trailing semicolons
  json = json.replace(/^var\s+\w+\s*=\s*/, '').replace(/;?\s*$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  // Response is typically an array; take the first element
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!entry || typeof entry !== 'object') return null;

  const e = entry as Record<string, unknown>;

  // Extract draw number
  const drawNumber = String(e['no'] ?? e['drawNo'] ?? e['DrawNo'] ?? '');

  // Extract draw date
  const drawDate = String(e['date'] ?? e['drawDate'] ?? e['DrawDate'] ?? '');

  // Extract winning numbers – field names vary; try common keys
  const rawNums =
    (e['no1'] !== undefined
      ? [e['no1'], e['no2'], e['no3'], e['no4'], e['no5'], e['no6']]
      : null) ??
    (e['winningNumbers'] as unknown[]) ??
    (e['numbers'] as unknown[]) ??
    [];

  const winningNumbers = (rawNums as unknown[])
    .map((n) => parseInt(String(n), 10))
    .filter((n) => !isNaN(n) && n >= 1 && n <= 49);

  if (winningNumbers.length < 6) return null;

  const extraNumber = parseInt(
    String(e['sno'] ?? e['extraNumber'] ?? e['extra'] ?? ''),
    10,
  );

  if (isNaN(extraNumber) || extraNumber < 1 || extraNumber > 49) return null;

  return {
    drawNumber,
    drawDate,
    winningNumbers: winningNumbers.slice(0, 6),
    extraNumber,
  };
}

export async function fetchLatestResult(date?: string): Promise<DrawResult> {
  // Use cache when no specific date is requested and cache is fresh
  if (!date) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp }: CachedResult = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          return data;
        }
      } catch {
        // ignore corrupt cache
      }
    }
  }

  const hkjcUrl = buildHkjcUrl(date);
  const proxyUrl = wrapWithProxy(hkjcUrl);

  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const text = await response.text();

  const result = parseHkjcJson(text);
  if (!result) throw new Error('Failed to parse HKJC response');

  // Cache only latest results (no specific date)
  if (!date) {
    const entry: CachedResult = { data: result, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  }

  return result;
}

// Keep legacy fetchDrawResult for backward-compatibility with TicketUpload draw-number lookup
export async function fetchDrawResult(drawNumber: string): Promise<DrawResult | null> {
  // NOTE: This routes data through a third-party service. Users concerned about
  // privacy should verify results directly on the HKJC website instead.
  try {
    const result = await fetchLatestResult();
    if (result.drawNumber === drawNumber) return result;
  } catch {
    // fall through to null
  }
  return null;
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
