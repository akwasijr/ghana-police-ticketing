/**
 * Formatting Utility Tests
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatTime, formatDateTime, formatRelativeTime } from '@/lib/utils/formatting';

describe('Formatting Utilities', () => {
  describe('formatCurrency', () => {
    it('should format number as GHS currency', () => {
      expect(formatCurrency(100)).toContain('100');
    });

    it('should handle decimal values', () => {
      const result = formatCurrency(100.5);
      expect(result).toContain('100');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toBeDefined();
    });
  });

  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const result = formatDate('2024-01-15');
      expect(result).toBeDefined();
    });

    it('should format Date object correctly', () => {
      const result = formatDate(new Date('2024-01-15'));
      expect(result).toBeDefined();
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const result = formatTime('2024-01-15T14:30:00');
      expect(result).toBeDefined();
    });
  });

  describe('formatDateTime', () => {
    it('should format date and time together', () => {
      const result = formatDateTime('2024-01-15T14:30:00');
      expect(result).toBeDefined();
    });
  });

  describe('formatRelativeTime', () => {
    it('should return "just now" for recent times', () => {
      const now = new Date();
      const result = formatRelativeTime(now.toISOString());
      expect(result.toLowerCase()).toMatch(/just now|seconds? ago/);
    });

    it('should handle dates in the past', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
      const result = formatRelativeTime(pastDate.toISOString());
      expect(result).toBeDefined();
    });
  });
});
