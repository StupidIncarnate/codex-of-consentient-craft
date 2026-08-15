/**
 * PURPOSE: States, once per concern, what a BlightConcern review unit actually asks — so
 * blightChecklistToTextTransformer can render one legend line per concern PRESENT on a diff
 * instead of repeating the ask against every file × concern crossing
 *
 * USAGE:
 * blightConcernLegendStatics.byConcern.craft;
 * // Returns the sentence describing what the `craft` concern asks
 *
 * A changed file clears each concern independently, and a diff can carry dozens of files — stating
 * the ask once per concern actually present, instead of against every unit, is what keeps a large
 * diff's checklist affordable to read.
 *
 * Keys must stay 1:1 with `blightConcernContract`'s options (`craft`, `perf`, `dedup`,
 * `integrity`, `test-cases`). A statics file may only import statics/, so it cannot import the
 * contract to cross-check its own keys — this literal, and its colocated test, are the coverage
 * assertion. Keep it hand-synced with blight-concern-contract.ts if that enum ever changes.
 */

export const blightConcernLegendStatics = {
  byConcern: {
    craft:
      'logic-vs-signature correctness, a PURPOSE header that is true of the body beneath it (lint checks the header exists, never that it is accurate), and error handling that propagates useful context',
    perf: 'quadratic loops, N+1, sync I/O in async, unbounded work, plus simplification — work the code performs that it need not perform at all',
    dedup: 'semantic duplication, within-diff and against existing repo code',
    integrity:
      'code that typechecks but MEANS something different to its consumers, plus stubs, fixtures, or `.default(...)` papering over a break',
    'test-cases':
      'every branch this commit added has a test case at all — the narrower question a diff answers on its own, not whether a spec observable is proven, which is the Flowrider track',
  },
} as const;
