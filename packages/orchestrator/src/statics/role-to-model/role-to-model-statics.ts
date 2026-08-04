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
  'blightwarden-minion': 'sonnet',
  'blightwarden-crosscut-minion': 'sonnet',
  blightwarden: 'sonnet',
  pesteater: 'opus',
} as const;
