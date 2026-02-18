import { describe, it, expect } from 'vitest';
import { getTheme } from '../theme';

describe('getTheme', () => {
  it('creates light theme', () => {
    const theme = getTheme(false);
    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.primary.main).toBe('#003366');
    expect(theme.palette.secondary.main).toBe('#FFD700');
  });

  it('creates dark theme', () => {
    const theme = getTheme(true);
    expect(theme.palette.mode).toBe('dark');
  });
});
