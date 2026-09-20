/**
 * PURPOSE: The lifecycle state of an instance — exactly `alive`, `killed`, `dead`, `pruned` or
 * `unknown`, the closed set every status and results query answers with. `pruned` and `unknown`
 * are REAL ANSWERS, never empty results: a query landing on reclaimed evidence that came back `[]`
 * would read as "that step produced nothing", the one conclusion a fixer must never draw from a
 * missing file, and a mistyped id answering the same way sends it looking at the app instead of at
 * its own record. Reach for this over reading a heartbeat file's presence directly — this is the
 * answer a caller acts on; the file is only how one of the five gets decided.
 *
 * USAGE:
 * instanceStateContract.parse('pruned');
 * // Returns: 'pruned' as InstanceState
 */

import { z } from 'zod';

export const instanceStateContract = z
  .enum(['alive', 'killed', 'dead', 'pruned', 'unknown'])
  .brand<'InstanceState'>();

export type InstanceState = z.infer<typeof instanceStateContract>;
