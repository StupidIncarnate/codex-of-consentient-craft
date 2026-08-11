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
  bughunt: 'opus',
  tavernkeeper: 'opus',
  flowrider: 'opus',
  groundstomper: 'opus',
  siegemaster: 'opus',
  codeweaver: 'opus',
  spiritmender: 'sonnet',
  'blightwarden-group-minion': 'sonnet',
  'blightwarden-crosscut-minion': 'sonnet',
  blightwarden: 'sonnet',
  pesteater: 'opus',
  warpgate: 'opus',
} as const;
