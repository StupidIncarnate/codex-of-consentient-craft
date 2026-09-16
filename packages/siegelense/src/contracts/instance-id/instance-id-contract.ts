/**
 * PURPOSE: An instance identifier that is MINTED, never chosen — "every rule [in siegemaster's
 * lane-name allocation] exists because a human-chosen name can collide. A minted id deletes the
 * section and its whole failure class" (siegelense-tooling.md line 114). Reach for this over RunId
 * whenever the value identifies WHICH DRIVER PROCESS a call targets; RunId only numbers a run inside
 * one already-identified instance's timeline. The regex carries an explicit message: this is the one
 * contract in the package a HUMAN types by hand, at a terminal, via `--instance <id>` — a bare
 * `.regex()` reports `"Invalid"` with an empty `path`, naming neither the value nor the shape it
 * needed, so the caller has nothing to act on.
 *
 * USAGE:
 * instanceIdContract.parse('inst_7f3a9c21');
 * // Returns a branded InstanceId
 */

import { z } from 'zod';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const instanceIdContract = z
  .string()
  .regex(
    new RegExp(`^${instanceLifecycleStatics.ids.instancePrefix}[0-9a-f]{4,}$`, 'u'),
    `Instance id must look like "${instanceLifecycleStatics.ids.instancePrefix}" followed by 4 or more lowercase hex characters, e.g. "${instanceLifecycleStatics.ids.instancePrefix}7f3a9c21"`,
  )
  .brand<'InstanceId'>();

export type InstanceId = z.infer<typeof instanceIdContract>;
