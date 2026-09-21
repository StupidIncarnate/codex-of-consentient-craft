/**
 * PURPOSE: The closed vocabulary a routed graph's route key may use — `done`, `unmet`, `empty` or
 * `wall`. `graphReachabilityViolationsTransformer`'s rule 5 is what refuses everything else, so a
 * renamed vocabulary (`pass`, `green`, `rework`, `confirmed`) is a red rather than a silent stall.
 *
 * USAGE:
 * graphOutcomeWordStatics.words.some((word) => word === outcome);
 * // Returns true when `outcome` is one of the four declared words
 */
export const graphOutcomeWordStatics = {
  words: ['done', 'unmet', 'empty', 'wall'],
} as const;
