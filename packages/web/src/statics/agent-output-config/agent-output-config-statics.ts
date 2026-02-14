/**
 * PURPOSE: Defines immutable configuration for the agent output panel appearance and behavior
 *
 * USAGE:
 * agentOutputConfigStatics.terminal.backgroundColor;
 * // Returns '#0d1117'
 */

export const agentOutputConfigStatics = {
  limits: {
    maxLinesPerSlot: 500,
    warningThreshold: 400,
  },
  terminal: {
    backgroundColor: '#0d0907',
    textColor: '#e0cfc0',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  scrollbar: {
    width: 8,
  },
} as const;
