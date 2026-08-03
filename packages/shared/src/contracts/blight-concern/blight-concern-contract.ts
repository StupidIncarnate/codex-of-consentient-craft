/**
 * PURPOSE: Defines the seven concern families a blightwarden review unit crosses with one changed
 * file — `<repo-relative-impl-path>:<concern>`
 *
 * USAGE:
 * blightConcernContract.parse('security');
 * // Returns: BlightConcern enum value
 *
 * A changed file clears each concern independently — passing `coverage` says nothing about
 * `security` — so a file's review is complete only once every concern below has its own ledger
 * entry:
 * - `coverage` — every branch in the impl has a real test (if/else, switch, ternary, `?.`, `??`,
 *   try/catch, conditional JSX, event handlers), plus `it.each` collapse of copy-paste state matrices
 * - `craft` — logic-vs-signature correctness, error handling that propagates useful context, simplification
 * - `security` — untrusted source reaching a dangerous sink without a validating contract
 * - `dedup` — semantic duplication, within-diff and against existing repo code
 * - `perf` — quadratic loops, N+1, sync I/O in async, unbounded work
 * - `integrity` — consumers of changed exports still work (signature/semantic change, removal, rename)
 * - `dead-code` — orphan exports and unreachable branches
 */

import { z } from 'zod';

export const blightConcernContract = z.enum([
  'coverage',
  'craft',
  'security',
  'dedup',
  'perf',
  'integrity',
  'dead-code',
]);

export type BlightConcern = z.infer<typeof blightConcernContract>;
