/**
 * PURPOSE: Config for `graphReachabilityCheckBroker` — the terminal markers each graph level ends
 * at, and the closed roster of `handler:` names story 20 builds (`commit`, `ward`, `riftcarver`,
 * `cleanup` — no others are wired, so a fifth name here is a bug in the config it checks, not a
 * name to add).
 *
 * USAGE:
 * graphReachabilityCheckStatics.familyTerminals
 * // Returns ['@complete', '@blocked']
 * graphReachabilityCheckStatics.stepTerminals
 * // Returns ['@done', '@blocked']
 * graphReachabilityCheckStatics.knownHandlers
 * // Returns ['commit', 'ward', 'riftcarver', 'cleanup']
 */
export const graphReachabilityCheckStatics = {
  familyTerminals: ['@complete', '@blocked'],
  stepTerminals: ['@done', '@blocked'],
  knownHandlers: ['commit', 'ward', 'riftcarver', 'cleanup'],
} as const;
