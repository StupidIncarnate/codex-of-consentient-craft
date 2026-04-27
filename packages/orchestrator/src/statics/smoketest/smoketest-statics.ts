/**
 * PURPOSE: Fixed identifiers and timeouts used by all smoketest scenarios so prompts can reference known values without per-run templating
 *
 * USAGE:
 * smoketestStatics.questId;
 * // Returns: '00000000-0000-0000-0000-000000000000'
 */

export const smoketestStatics = {
  questId: '00000000-0000-0000-0000-000000000000',
  defaultTimeoutMs: 60000,
  orchestrationCaseTimeoutMs: 300000,
} as const;
