/**
 * PURPOSE: The position of one step inside a single run, restarting at 1 for EVERY run rather than
 * counting across an instance's whole lifetime — "step numbering restarts at 1 PER RUN: `stoppedAt:
 * { step: 4 }` then reads naturally inside its own run, and cannot be confused with another's"
 * (siegelense-tooling.md line 77), and "`stoppedAt: { step: 4 }` and `results { run, step: 4 }` must
 * name the same thing, and an instance carries many runs" (line 1753). Reach for this over RunId
 * whenever the value counts a position WITHIN a run; RunId only identifies which run.
 *
 * USAGE:
 * stepIndexContract.parse(4);
 * // Returns a branded StepIndex
 */

import { z } from 'zod';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const stepIndexContract = z
  .number()
  .int()
  .min(instanceLifecycleStatics.numbering.firstStep)
  .brand<'StepIndex'>();

export type StepIndex = z.infer<typeof stepIndexContract>;
