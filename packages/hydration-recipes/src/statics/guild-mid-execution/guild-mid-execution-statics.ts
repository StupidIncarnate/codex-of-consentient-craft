/**
 * PURPOSE: The row counts the `guild-mid-execution` recipe seeds — three quests under the guild,
 * five operations on the first quest's ledger before the riftcarver one is dropped.
 *
 * USAGE:
 * guildMidExecutionStatics.counts.quests;
 * // Returns 3
 */
export const guildMidExecutionStatics = {
  counts: {
    quests: 3,
    operations: 5,
  },
} as const;
