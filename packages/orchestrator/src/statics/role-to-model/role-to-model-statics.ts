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
  siegemaster: 'opus',
  codeweaver: 'sonnet',
  spiritmender: 'sonnet',
  lawbringer: 'sonnet',
  blightwarden: 'sonnet',
} as const;
