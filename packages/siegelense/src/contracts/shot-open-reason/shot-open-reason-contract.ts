/**
 * PURPOSE: Why one shot in a run's `shots` list is flagged `open: true` for a session to actually
 * view. The five members are listed in PRECEDENCE order — `blank` outranks `failed`, which outranks
 * the positional `start`/`end`, which outranks `changed` — and that order is DATA the transformer
 * reads rather than a rule `shotOpenDecideTransformer` re-encodes: a shot that is both blank and the
 * failing step reports `blank`, because a dead page is the more diagnostic finding, the same way a
 * shot that is both a positional pick and the failing step already reports `failed` over `start`/
 * `end`. Reach for this over RunStatus: RunStatus is ONE verdict for the whole run; ShotOpenReason
 * explains ONE shot's own inclusion, and a single `failed` run can still carry a `start` shot that
 * opened for context alongside the `failed` one.
 *
 * USAGE:
 * shotOpenReasonContract.parse('failed');
 * // Returns a branded ShotOpenReason
 */

import { z } from 'zod';

export const shotOpenReasonContract = z
  .enum(['blank', 'failed', 'start', 'end', 'changed'])
  .brand<'ShotOpenReason'>();

export type ShotOpenReason = z.infer<typeof shotOpenReasonContract>;
