/**
 * Logger Utility Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLogger, logger } from '@/lib/utils/logger';

describe('Logger Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLogger', () => {
    it('should create a logger with default options', () => {
      const testLogger = createLogger();
      
      expect(testLogger).toHaveProperty('debug');
      expect(testLogger).toHaveProperty('info');
      expect(testLogger).toHaveProperty('warn');
      expect(testLogger).toHaveProperty('error');
      expect(testLogger).toHaveProperty('log');
      expect(testLogger).toHaveProperty('child');
      expect(testLogger).toHaveProperty('group');
      expect(testLogger).toHaveProperty('table');
    });

    it('should create a child logger with prefix', () => {
      const parentLogger = createLogger({ prefix: 'Parent' });
      const childLogger = parentLogger.child('Child');
      
      expect(childLogger).toHaveProperty('info');
    });
  });

  describe('default logger', () => {
    it('should be exported', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
    });
  });
});
