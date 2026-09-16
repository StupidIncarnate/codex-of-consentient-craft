/**
 * PURPOSE: What a dead instance was doing when it died — the run, the step within it, and the verb
 * that step drove (spec line 1177, 1197: "usually the whole answer... reliable precisely because
 * the transcript flushes per step rather than buffering"). Reach for this over reading the
 * transcript file directly from `instanceStatusContract.evidence.dir` — this is the one line a
 * session needs before it decides whether to open the rest.
 *
 * USAGE:
 * lastStepReadingContract.parse({ run: 'run_2', step: 7, verb: 'click' });
 * // Returns a validated LastStepReading
 */

import { z } from 'zod';

import { runIdContract } from '../run-id/run-id-contract';
import { stepIndexContract } from '../step-index/step-index-contract';
import { stepVerbContract } from '../step-verb/step-verb-contract';

export const lastStepReadingContract = z.object({
  run: runIdContract,
  step: stepIndexContract,
  verb: stepVerbContract,
});

export type LastStepReading = z.infer<typeof lastStepReadingContract>;
