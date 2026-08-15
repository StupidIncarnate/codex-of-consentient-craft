/**
 * PURPOSE: Defines the five concern families a blightscout review unit crosses with one changed
 * file — `<repo-relative-impl-path>:<concern>`
 *
 * USAGE:
 * blightConcernContract.parse('craft');
 * // Returns: BlightConcern enum value
 *
 * Blightscout's question is "is the changed CODE well-made?", asked once per commit rather than once
 * per quest. The hands-on walk track belongs to Siegemaster, whose off-map `hostile-input` probe
 * proves security by sending a real payload rather than reading for one.
 *
 * A changed file clears each concern independently — passing `craft` says nothing about `perf` — so
 * a file's review is complete only once every concern below has its own ledger entry:
 * - `craft` — logic-vs-signature correctness, a PURPOSE header that is true of the body beneath it
 *   (lint checks that the header EXISTS, never that it is accurate, and neither a test nor tsc can
 *   read a comment), and error handling that propagates useful context
 * - `perf` — quadratic loops, N+1, sync I/O in async, unbounded work, plus simplification: work the
 *   code performs that it need not perform at all
 * - `dedup` — semantic duplication, within-commit and against existing repo code. Searched
 *   REPO-WIDE, never within the commit alone: every earlier commit on the branch is already on disk,
 *   and commits are ordered, so a repo-wide search from the later of any duplicate pair is what
 *   makes a whole-diff cross-cutting pass unnecessary
 * - `integrity` — code that typechecks but MEANS something different to its consumers, plus stubs,
 *   fixtures, and `.default(...)` that paper over a break instead of surfacing it. `ward(full)` and
 *   tsc already own the pure signature sweep, so this concern does not repeat it
 * - `test-cases` — did every branch this commit ADDED get a test at all. Distinct from Flowrider's
 *   track, which proves a spec observable holds: this one asks the narrower question a diff can
 *   answer on its own, and catches the conditional written without a case long before the
 *   observable-level gate would
 *
 * Whole-import-graph questions — orphan exports, dead files — are NOT here and are not owned
 * anywhere: a per-file crossing can never see the graph, and the whole-diff minion that used to ask
 * is deleted in favour of a deterministic tool.
 */

import { z } from 'zod';

export const blightConcernContract = z.enum(['craft', 'perf', 'dedup', 'integrity', 'test-cases']);

export type BlightConcern = z.infer<typeof blightConcernContract>;
