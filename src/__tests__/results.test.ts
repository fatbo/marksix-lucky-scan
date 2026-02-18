import { describe, it, expect } from 'vitest';
import { compareNumbers, parseHkjcJson } from '../utils/results';
import type { DrawResult } from '../types';

const mockResult: DrawResult = {
  drawNumber: '26/019',
  drawDate: '2024-01-01',
  winningNumbers: [1, 12, 23, 34, 45, 49],
  extraNumber: 7,
};

describe('compareNumbers', () => {
  it('detects 1st prize (6 matches)', () => {
    const result = compareNumbers([1, 12, 23, 34, 45, 49], mockResult);
    expect(result.prizeTier).toBe(1);
    expect(result.matchedNumbers.length).toBe(6);
  });

  it('detects 2nd prize (5 + extra)', () => {
    const result = compareNumbers([1, 12, 23, 34, 45, 7], mockResult);
    expect(result.prizeTier).toBe(2);
    expect(result.matchedNumbers.length).toBe(5);
    expect(result.extraMatched).toBe(true);
  });

  it('detects 3rd prize (5 matches)', () => {
    const result = compareNumbers([1, 12, 23, 34, 45, 2], mockResult);
    expect(result.prizeTier).toBe(3);
    expect(result.matchedNumbers.length).toBe(5);
  });

  it('detects 4th prize (4 + extra)', () => {
    const result = compareNumbers([1, 12, 23, 34, 7, 2], mockResult);
    expect(result.prizeTier).toBe(4);
  });

  it('detects 5th prize (4 matches)', () => {
    const result = compareNumbers([1, 12, 23, 34, 2, 3], mockResult);
    expect(result.prizeTier).toBe(5);
  });

  it('detects 6th prize (3 + extra)', () => {
    const result = compareNumbers([1, 12, 23, 7, 2, 3], mockResult);
    expect(result.prizeTier).toBe(6);
  });

  it('detects 7th prize (3 matches)', () => {
    const result = compareNumbers([1, 12, 23, 2, 3, 4], mockResult);
    expect(result.prizeTier).toBe(7);
  });

  it('returns no prize for < 3 matches', () => {
    const result = compareNumbers([1, 12, 2, 3, 4, 5], mockResult);
    expect(result.prizeTier).toBeNull();
    expect(result.prizeCategory).toBeNull();
  });
});

describe('parseHkjcJson', () => {
  it('parses a valid HKJC JSON array response', () => {
    const raw = JSON.stringify([
      {
        no: '26/020',
        date: '21/02/2026',
        no1: 8, no2: 15, no3: 26, no4: 34, no5: 40, no6: 49,
        sno: 5,
      },
    ]);
    const result = parseHkjcJson(raw);
    expect(result).not.toBeNull();
    expect(result!.drawNumber).toBe('26/020');
    expect(result!.winningNumbers).toEqual([8, 15, 26, 34, 40, 49]);
    expect(result!.extraNumber).toBe(5);
  });

  it('strips leading JS variable assignment before parsing', () => {
    const raw = 'var data=' + JSON.stringify([
      { no: '26/020', date: '21/02/2026', no1: 1, no2: 2, no3: 3, no4: 4, no5: 5, no6: 6, sno: 7 },
    ]) + ';';
    const result = parseHkjcJson(raw);
    expect(result).not.toBeNull();
    expect(result!.winningNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('returns null for invalid JSON', () => {
    expect(parseHkjcJson('not json at all')).toBeNull();
  });

  it('returns null when fewer than 6 winning numbers present', () => {
    const raw = JSON.stringify([{ no: '26/020', date: '2026-02-21', no1: 1, no2: 2, no3: 3, sno: 7 }]);
    expect(parseHkjcJson(raw)).toBeNull();
  });
});
