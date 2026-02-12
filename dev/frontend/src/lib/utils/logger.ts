/**
 * Logger Utility
 * 
 * Provides environment-aware logging that:
 * - Only logs in development mode (prevents console pollution in production)
 * - Supports different log levels with prefixes
 * - Can be extended for remote logging services
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

const isDev = import.meta.env.DEV;

// Color codes for different log levels (for browser console)
const levelColors: Record<LogLevel, string> = {
  debug: '#9CA3AF', // gray
  info: '#3B82F6',  // blue
  warn: '#F59E0B',  // amber
  error: '#EF4444', // red
};

const levelIcons: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

function createLogMethod(level: LogLevel, prefix: string, enabled: boolean) {
  return (...args: unknown[]) => {
    // Always log errors, but skip other levels in production
    if (!enabled && level !== 'error') return;
    if (!isDev && level !== 'error') return;

    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    const icon = levelIcons[level];
    const color = levelColors[level];
    const fullPrefix = prefix ? `[${prefix}]` : '';
    
    const consoleMethod = level === 'debug' ? console.log : console[level];
    
    consoleMethod(
      `%c${icon} ${timestamp} ${fullPrefix}`,
      `color: ${color}; font-weight: bold;`,
      ...args
    );
  };
}

function createLogger(options: LoggerOptions = {}) {
  const { prefix = '', enabled = true } = options;
  
  return {
    debug: createLogMethod('debug', prefix, enabled),
    info: createLogMethod('info', prefix, enabled),
    warn: createLogMethod('warn', prefix, enabled),
    error: createLogMethod('error', prefix, enabled),
    
    // Log only in development
    log: (...args: unknown[]) => {
      if (isDev) console.log(...args);
    },
    
    // Create a child logger with a specific prefix
    child: (childPrefix: string) => createLogger({
      prefix: prefix ? `${prefix}:${childPrefix}` : childPrefix,
      enabled,
    }),
    
    // Group related logs
    group: (label: string, fn: () => void) => {
      if (!isDev) return fn();
      console.group(label);
      fn();
      console.groupEnd();
    },
    
    // Table logging for arrays/objects
    table: (data: unknown) => {
      if (isDev) console.table(data);
    },
    
    // Time measurement
    time: (label: string) => {
      if (isDev) console.time(label);
    },
    timeEnd: (label: string) => {
      if (isDev) console.timeEnd(label);
    },
  };
}

// Default logger instance
export const logger = createLogger();

// Pre-configured loggers for different modules
export const appLogger = createLogger({ prefix: 'App' });
export const syncLogger = createLogger({ prefix: 'Sync' });
export const pwaLogger = createLogger({ prefix: 'PWA' });
export const auditLogger = createLogger({ prefix: 'Audit' });
export const apiLogger = createLogger({ prefix: 'API' });

// Export factory for custom loggers
export { createLogger };
