import { describe, it, expect } from 'vitest';
import { compareSemver } from '../src/utils/update-check.js';

describe('update-check', () => {
  describe('compareSemver', () => {
    it('returns 1 when a is greater than b', () => {
      expect(compareSemver('0.2.0', '0.1.0')).toBe(1);
      expect(compareSemver('1.0.0', '0.9.9')).toBe(1);
      expect(compareSemver('0.1.1', '0.1.0')).toBe(1);
    });

    it('returns -1 when a is less than b', () => {
      expect(compareSemver('0.1.0', '0.2.0')).toBe(-1);
      expect(compareSemver('0.9.9', '1.0.0')).toBe(-1);
    });

    it('returns 0 when versions are equal', () => {
      expect(compareSemver('0.1.0', '0.1.0')).toBe(0);
      expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
    });

    it('handles major version changes correctly', () => {
      expect(compareSemver('2.0.0', '1.9.9')).toBe(1);
      expect(compareSemver('1.9.9', '2.0.0')).toBe(-1);
    });
  });
});
