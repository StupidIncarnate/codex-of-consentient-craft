/**
 * PURPOSE: An instance identifier that is MINTED, never chosen — "every rule [in siegemaster's
 * lane-name allocation] exists because a human-chosen name can collide. A minted id deletes the
 * section and its whole failure class" (siegelense-tooling.md line 114). Reach for this over RunId
 * whenever the value identifies WHICH DRIVER PROCESS a call targets; RunId only numbers a run inside
 * one already-identified instance's timeline.
 *
 * USAGE:
 * instanceIdContract.parse('inst_7f3a9c21');
 * // Returns a branded InstanceId
 */

import { z } from 'zod';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const instanceIdContract = z
  .string()
  .regex(new RegExp(`^${instanceLifecycleStatics.ids.instancePrefix}[0-9a-f]{4,}$`, 'u'))
  .brand<'InstanceId'>();

export type InstanceId = z.infer<typeof instanceIdContract>;
