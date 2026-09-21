/**
 * PURPOSE: Config for `rule-graph-reachability-broker` — which statics file it attaches its
 * reports to (a rule that reads a graph at module load has nothing else to point a report at), and
 * the terminal markers the family graph's rules 1 and 2 are walked against.
 *
 * USAGE:
 * graphReachabilityStatics.scopeFilePaths
 * // Returns ['packages/shared/src/statics/quest-flow/quest-flow-statics.ts']
 * graphReachabilityStatics.familyTerminals
 * // Returns ['@complete', '@blocked']
 */
export const graphReachabilityStatics = {
  scopeFilePaths: ['packages/shared/src/statics/quest-flow/quest-flow-statics.ts'],
  familyTerminals: ['@complete', '@blocked'],
} as const;
