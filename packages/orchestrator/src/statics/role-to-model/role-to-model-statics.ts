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
  // One commit, five narrow concerns, no delegation — sonnet-sized, and it runs after nearly every
  // other item, so the model choice here is the one with the highest multiplier on a quest's cost.
  blightscout: 'sonnet',
  pesteater: 'opus',
  warpgate: 'opus',
} as const;
