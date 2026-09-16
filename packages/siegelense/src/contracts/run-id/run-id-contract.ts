/**
 * PURPOSE: Numbers one run within a single instance's timeline, starting at 1 and counting upward
 * for the life of that instance — "every `run` mints a run id and returns it: it is the handle for
 * everything that run produced" (siegelense-tooling.md line 76). Reach for this over StepIndex
 * whenever the value identifies WHICH RUN a step, a screenshot or a results query belongs to;
 * StepIndex only counts a position inside one already-identified run, and restarts at 1 every time.
 *
 * USAGE:
 * runIdContract.parse('run_2');
 * // Returns a branded RunId
 */

import { z } from 'zod';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const runIdContract = z
  .string()
  .regex(new RegExp(`^${instanceLifecycleStatics.ids.runPrefix}[1-9][0-9]*$`, 'u'))
  .brand<'RunId'>();

export type RunId = z.infer<typeof runIdContract>;
