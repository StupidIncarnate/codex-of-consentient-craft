/**
 * PURPOSE: States, once per concern, what a BlightConcern review unit actually asks — so
 * blightChecklistToTextTransformer can render one legend line per concern PRESENT on a diff
 * instead of repeating the ask against every file × concern crossing
 *
 * USAGE:
 * blightConcernLegendStatics.byConcern.security;
 * // Returns the sentence describing what the `security` concern asks
 *
 * A changed file clears each concern independently, and a diff can carry dozens of files — stating
 * the ask once per concern actually present, instead of against every unit, is what keeps a large
 * diff's checklist affordable to read.
 *
 * Keys must stay 1:1 with `blightConcernContract`'s options (`coverage`, `craft`, `security`,
 * `dedup`, `perf`, `integrity`, `dead-code`). A statics file may only import statics/, so it cannot
 * import the contract to cross-check its own keys — this literal, and its colocated test, are the
 * coverage assertion. Keep it hand-synced with blight-concern-contract.ts if that enum ever changes.
 */

export const blightConcernLegendStatics = {
  byConcern: {
    coverage:
      'every branch in the impl has a real test (if/else, switch, ternary, `?.`, `??`, try/catch, conditional JSX, event handlers), plus `it.each` collapse of copy-paste state matrices',
    craft:
      'logic-vs-signature correctness, error handling that propagates useful context, simplification',
    security: 'untrusted source reaching a dangerous sink without a validating contract',
    dedup: 'semantic duplication, within-diff and against existing repo code',
    perf: 'quadratic loops, N+1, sync I/O in async, unbounded work',
    integrity:
      'consumers of changed exports still work (signature/semantic change, removal, rename)',
    'dead-code': 'orphan exports and unreachable branches',
  },
} as const;
