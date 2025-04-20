/**
 * Debug utilities for development and testing
 */

interface TimeableFunction<T> {
  (): Promise<T> | T;
}

interface DebugTools {
  devLog: (message: string, ...args: unknown[]) => void;
  simulateDelay: (ms?: number) => Promise<void>;
  inspect: <T>(value: T, depth?: number) => T;
  timeFunction: <T>(fn: TimeableFunction<T>, label?: string) => Promise<T>;
  conditionalBreak: (condition: boolean, message?: string) => void;
  countCalls: (label?: string) => number;
  resetCounter: (label?: string) => void;
  group: (label: string, fn: () => void) => void;
  safeAccess: <T, K extends keyof T>(obj: T | null | undefined, key: K) => T[K] | undefined;
}

const isDevEnvironment = import.meta.env.DEV;

/**
 * Wrapper for logging only in development
 */
export const devLog = (message: string, ...args: any[]): void => {
  if (isDevEnvironment) {
    console.log(`[DEV] ${message}`, ...args);
  }
};

/**
 * Simulated network delay for testing
 */
export const simulateDelay = async (ms: number = 500): Promise<void> => {
  if (isDevEnvironment) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  return Promise.resolve();
};

/**
 * Utility to inspect a value with depth
 */
export const inspect = <T>(value: T, depth: number = 2): T => {
  if (isDevEnvironment) {
    console.log(
      '%c Value Inspection:',
      'background: #1e40af; color: white; padding: 2px 4px; border-radius: 2px;',
      JSON.stringify(value, null, depth)
    );
  }
  return value;
};

/**
 * Time a function execution
 */
export const timeFunction = async <T>(
  fn: () => Promise<T> | T,
  label: string = 'Function Execution'
): Promise<T> => {
  if (!isDevEnvironment) {
    return fn() as T;
  }

  console.time(label);
  try {
    const result = await fn();
    return result;
  } finally {
    console.timeEnd(label);
  }
};

/**
 * Create a conditional breakpoint
 */
export const conditionalBreak = (
  condition: boolean,
  message: string = 'Conditional breakpoint triggered'
): void => {
  if (isDevEnvironment && condition) {
    console.warn(`[BREAK] ${message}`);
    // Use debugger statement only in development
    debugger;
  }
};

/**
 * Count function calls during debug
 */
const counters = new Map<string, number>();

export const countCalls = (label: string = 'default'): number => {
  if (!isDevEnvironment) return 0;
  
  const count = (counters.get(label) || 0) + 1;
  counters.set(label, count);
  console.log(`[COUNT] ${label}: ${count}`);
  return count;
};

export const resetCounter = (label: string = 'default'): void => {
  if (isDevEnvironment) {
    counters.set(label, 0);
    console.log(`[COUNT] ${label}: reset`);
  }
};

/**
 * Group console logs
 */
export const group = (label: string, fn: () => void): void => {
  if (isDevEnvironment) {
    console.group(label);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  } else {
    fn();
  }
};

/**
 * Utility to safely access nested properties
 */
export function safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  return obj?.[key];
}

const debugTools: DebugTools = {
  devLog,
  simulateDelay,
  inspect,
  timeFunction,
  conditionalBreak,
  countCalls,
  resetCounter,
  group,
  safeAccess
};

export default debugTools;
