/**
 * PURPOSE: Reads a raw, not-yet-validated `--steps` batch only far enough to see which verb each
 * entry names and which keys it carries, so `stepBatchPreflightTransformer` can refuse an unknown
 * verb or a stray key in words a person can act on. Reach for `stepContract` to validate a step;
 * this contract validates nothing about a step's own fields — `passthrough` keeps every key the
 * caller typed so the stray ones can be named, and an entry that is not an object (or whose `step`
 * is not a string) fails here so the real contract reports it.
 *
 * USAGE:
 * stepBatchProbeContract.safeParse([{ step: 'goto', path: '/' }]);
 * // { success: true, data: [{ step: 'goto', path: '/' }] }
 */

import { z } from 'zod';

export const stepBatchProbeContract = z.array(
  z.object({ step: z.string().brand<'StepVerbProbe'>().optional() }).passthrough(),
);

export type StepBatchProbe = z.infer<typeof stepBatchProbeContract>;
