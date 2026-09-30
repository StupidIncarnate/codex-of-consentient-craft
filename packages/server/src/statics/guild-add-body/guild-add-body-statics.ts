/**
 * PURPOSE: Defines the length limits the guild-add body enforces
 *
 * USAGE:
 * guildAddBodyStatics.limits.nameMaxLength;
 * // Returns 100
 */

export const guildAddBodyStatics = {
  limits: {
    nameMaxLength: 100,
  },
} as const;
