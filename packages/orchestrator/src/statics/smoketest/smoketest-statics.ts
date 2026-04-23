/**
 * PURPOSE: Fixed identifiers and timeouts used by all smoketest scenarios so prompts can reference known values without per-run templating
 *
 * USAGE:
 * smoketestStatics.guildId;
 * // Returns: '00000000-0000-0000-0000-000000000001'
 * smoketestStatics.questId;
 * // Returns: '00000000-0000-0000-0000-000000000000'
 */

export const smoketestStatics = {
  guildId: '00000000-0000-0000-0000-000000000001',
  questId: '00000000-0000-0000-0000-000000000000',
  guildName: '__smoketests',
  defaultTimeoutMs: 60000,
  orchestrationCaseTimeoutMs: 300000,
} as const;
