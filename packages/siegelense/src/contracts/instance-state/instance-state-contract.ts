/**
 * PURPOSE: The lifecycle state of an instance — exactly `alive`, `killed`, `dead`, `pruned`,
 * `unknown` or `unusable`, the closed set every status and results query answers with. `pruned` and
 * `unknown` are REAL ANSWERS, never empty results: a query landing on reclaimed evidence that came
 * back `[]` would read as "that step produced nothing", the one conclusion a fixer must never draw
 * from a missing file, and a mistyped id answering the same way sends it looking at the app instead
 * of at its own record. `unusable` is a stored, verbatim answer too, written by `instanceRunBroker`
 * the moment a `run` batch stops on a failed `seed` step: the app now holds a partially-seeded world
 * with nothing to roll back to, so a caller must never keep driving it — `instanceRunBroker` refuses
 * every later `run` against it, naming why, while reads (`results`, `status`, `snapshots`) keep
 * answering normally, since the instance's own evidence is still real and still worth a fixer's
 * look. Reach for this over reading a heartbeat file's presence directly — this is the answer a
 * caller acts on; the file is only how one of the states gets decided.
 *
 * USAGE:
 * instanceStateContract.parse('pruned');
 * // Returns: 'pruned' as InstanceState
 */

import { z } from 'zod';

export const instanceStateContract = z
  .enum(['alive', 'killed', 'dead', 'pruned', 'unknown', 'unusable'])
  .brand<'InstanceState'>();

export type InstanceState = z.infer<typeof instanceStateContract>;
