/**
 * PURPOSE: Bounds the length of a guild name accepted by the guild-update body
 *
 * USAGE:
 * guildUpdateBodyLimitsStatics.maxNameLength;
 * // Returns 100
 */

export const guildUpdateBodyLimitsStatics = {
  maxNameLength: 100,
} as const;
