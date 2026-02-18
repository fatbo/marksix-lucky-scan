import { describe, it, expect } from 'vitest';
import { extractDrawNumber, extractNumbers, extractUnits, extractAmount } from '../utils/ocr';

describe('OCR extraction functions', () => {
  describe('extractDrawNumber', () => {
    it('extracts draw number in format XX/XXX', () => {
      expect(extractDrawNumber('Draw No. 26/019 something')).toBe('26/019');
    });
    it('extracts draw number with 期數', () => {
      expect(extractDrawNumber('期數 26/019')).toBe('26/019');
    });
    it('extracts standalone draw number pattern', () => {
      expect(extractDrawNumber('some text 24/100 more text')).toBe('24/100');
    });
    it('returns empty string if not found', () => {
      expect(extractDrawNumber('no draw number here')).toBe('');
    });
  });

  describe('extractNumbers', () => {
    it('extracts numbers from a line with multiple numbers', () => {
      const result = extractNumbers('1 12 23 34 45 49');
      expect(result).toEqual([1, 12, 23, 34, 45, 49]);
    });
    it('limits to 7 numbers', () => {
      const result = extractNumbers('1 2 3 4 5 6 7 8 9 10');
      expect(result.length).toBeLessThanOrEqual(7);
    });
    it('filters out numbers > 49', () => {
      const result = extractNumbers('1 12 23 50 99 34 45');
      expect(result).not.toContain(50);
      expect(result).not.toContain(99);
    });
    it('returns empty for no valid numbers', () => {
      const result = extractNumbers('no numbers here');
      expect(result).toEqual([]);
    });
  });

  describe('extractUnits', () => {
    it('extracts units with 注', () => {
      expect(extractUnits('5注')).toBe(5);
    });
    it('extracts units with Units', () => {
      expect(extractUnits('10 Units')).toBe(10);
    });
    it('defaults to 1', () => {
      expect(extractUnits('no units')).toBe(1);
    });
  });

  describe('extractAmount', () => {
    it('extracts amount with $', () => {
      expect(extractAmount('$100')).toBe(100);
    });
    it('extracts amount with HK$', () => {
      expect(extractAmount('HK$50.00')).toBe(50);
    });
    it('extracts amount with commas', () => {
      expect(extractAmount('$1,000')).toBe(1000);
    });
    it('extracts amount with 金額', () => {
      expect(extractAmount('金額 $200')).toBe(200);
    });
    it('defaults to 10', () => {
      expect(extractAmount('no amount')).toBe(10);
    });
  });
});
