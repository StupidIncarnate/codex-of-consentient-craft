/**
 * PURPOSE: Maps each Claude-spawning work-item role to the Claude CLI --model flag value
 *
 * USAGE:
 * roleToModelStatics.pathseeker;
 * // Returns 'opus'
 */

export const roleToModelStatics = {
  chaoswhisperer: 'opus',
  glyphsmith: 'opus',
  pathseeker: 'opus',
  'pathseeker-surface': 'sonnet',
  'pathseeker-dedup': 'sonnet',
  'pathseeker-assertion-correctness': 'sonnet',
  'pathseeker-walk': 'opus',
  siegemaster: 'opus',
  codeweaver: 'sonnet',
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
