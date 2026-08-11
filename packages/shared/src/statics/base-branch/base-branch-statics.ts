/**
 * PURPOSE: Single source of truth for the local branch names Start probes when resolving the base
 * branch a quest forks from. Start probes these names in this order, and the merge agent targets
 * whichever one was found, so the probe order and the accepted values are one list.
 *
 * USAGE:
 * baseBranchStatics.candidates;
 * // Returns ['main', 'master'], the tuple baseBranchNameContract builds its enum from
 */

export const baseBranchStatics = {
  candidates: ['main', 'master'],
} as const;
