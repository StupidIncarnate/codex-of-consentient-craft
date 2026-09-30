/**
 * PURPOSE: What `results` hands back. `instanceState` rides on EVERY answer so a reading is never
 * mistaken for a live one (siegelense-tooling.md line 2239); `pruned` and `unknown` are REAL
 * answers with `rows: []` and a reason (`prunedAtMs`/`prunedByRule`), never the same empty array a
 * genuinely-empty query would return (line 2249). `matched`/`returned`/`truncated` self-report the
 * `resultsStatics.limits.maxRows` cap, so a caller can tell "200 of 200" from "200 of 900" instead
 * of reading a silently clipped list as the whole answer. `storedReturn` carries `run`'s own return
 * when the query named no `step` and no `kind` (line 2229). Reach for this over RunResult: a
 * RunResult is what `run` itself returns for the batch it just executed, while a ResultsAnswer is
 * what a LATER, narrower `results` query returns, against an instance that may be long dead.
 *
 * USAGE:
 * resultsAnswerContract.parse({
 *   instanceId: 'inst_7f3a9c21', instanceState: 'alive', runId: 'run_2', kind: 'console',
 *   step: null, verb: null, prunedAtMs: null, prunedByRule: null, matched: 3, returned: 3,
 *   truncated: false, rows: ['{"level":"error"}'], storedReturn: null,
 * });
 * // Returns a validated ResultsAnswer
 */

import { z } from '#gateway/npm/zod';

import { siegeInstanceContract, siegeRunContract } from '@dungeonmaster/shared/contracts';

import { instanceStateContract } from '../instance-state/instance-state-contract';
import { resultKindContract } from '../result-kind/result-kind-contract';
import { runResultContract } from '../run-result/run-result-contract';
import { stepVerbContract } from '../step-verb/step-verb-contract';
import { instanceLifecycleStatics } from '../../statics/instance-lifecycle/instance-lifecycle-statics';

export const resultsAnswerContract = z.object({
  instanceId: siegeInstanceContract.shape.id,
  instanceState: instanceStateContract,
  runId: siegeRunContract.shape.id.nullable(),
  kind: resultKindContract.nullable(),
  step: z.number().int().min(instanceLifecycleStatics.numbering.firstStep).brand<'ResultsAnswerStep'>().nullable(),
  verb: stepVerbContract.nullable(),
  prunedAtMs: z.number().int().nonnegative().brand<'ResultsAnswerPrunedAtMs'>().nullable(),
  prunedByRule: z.string().brand<'ResultsAnswerPrunedByRule'>().nullable(),
  matched: z.number().int().nonnegative().brand<'ResultsAnswerMatched'>(),
  returned: z.number().int().nonnegative().brand<'ResultsAnswerReturned'>(),
  truncated: z.boolean(),
  rows: z.array(z.string().brand<'ResultsAnswerRows'>()).readonly(),
  storedReturn: runResultContract.nullable(),
});

export type ResultsAnswer = z.infer<typeof resultsAnswerContract>;
