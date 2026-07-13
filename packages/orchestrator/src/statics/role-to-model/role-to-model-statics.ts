/**
 * PURPOSE: Maps each Claude-spawning work-item role to the Claude CLI --model flag value
 *
 * USAGE:
 * roleToModelStatics.codeweaver;
 * // Returns 'opus'
 */

export const roleToModelStatics = {
  chaoswhisperer: 'opus',
  glyphsmith: 'opus',
  flowrider: 'opus',
  siegemaster: 'opus',
  codeweaver: 'opus',
  spiritmender: 'sonnet',
  lawbringer: 'sonnet',
  'blightwarden-security-minion': 'sonnet',
  'blightwarden-dedup-minion': 'sonnet',
  'blightwarden-perf-minion': 'sonnet',
  'blightwarden-integrity-minion': 'sonnet',
  'blightwarden-dead-code-minion': 'sonnet',
  blightwarden: 'sonnet',
  pesteater: 'opus',
} as const;
