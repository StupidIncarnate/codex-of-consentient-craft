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
    backgroundColor: '#0d1117',
    textColor: '#e6edf3',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  scrollbar: {
    width: 8,
  },
} as const;
