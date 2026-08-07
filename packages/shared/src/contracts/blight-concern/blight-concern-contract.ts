/**
 * PURPOSE: Defines the four concern families a blightwarden review unit crosses with one changed
 * file — `<repo-relative-impl-path>:<concern>`
 *
 * USAGE:
 * blightConcernContract.parse('craft');
 * // Returns: BlightConcern enum value
 *
 * Blightwarden's question is "is the changed CODE well-made?". The test track belongs to Flowrider
 * and the hands-on walk track to Siegemaster, whose off-map `hostile-input` probe proves security by
 * sending a real payload rather than reading for one. Whole-import-graph questions — orphan exports —
 * belong to a dedicated whole-diff minion, because a per-file crossing can never see the graph.
 *
 * A changed file clears each concern independently — passing `craft` says nothing about `perf` — so
 * a file's review is complete only once every concern below has its own ledger entry:
 * - `craft` — logic-vs-signature correctness, a PURPOSE header that is true of the body beneath it
 *   (lint checks that the header EXISTS, never that it is accurate, and neither a test nor tsc can
 *   read a comment), and error handling that propagates useful context
 * - `perf` — quadratic loops, N+1, sync I/O in async, unbounded work, plus simplification: work the
 *   code performs that it need not perform at all
 * - `dedup` — semantic duplication, within-diff and against existing repo code
 * - `integrity` — code that typechecks but MEANS something different to its consumers, plus stubs,
 *   fixtures, and `.default(...)` that paper over a break instead of surfacing it. `ward(full)` and
 *   tsc already own the pure signature sweep, so this concern does not repeat it
 */

import { z } from 'zod';

export const blightConcernContract = z.enum(['craft', 'perf', 'dedup', 'integrity']);

export type BlightConcern = z.infer<typeof blightConcernContract>;
