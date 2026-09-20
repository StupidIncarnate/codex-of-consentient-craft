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

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { instanceStateContract } from '../instance-state/instance-state-contract';
import { readingCountContract } from '../reading-count/reading-count-contract';
import { resultKindContract } from '../result-kind/result-kind-contract';
import { runIdContract } from '../run-id/run-id-contract';
import { runResultContract } from '../run-result/run-result-contract';
import { stepIndexContract } from '../step-index/step-index-contract';
import { stepVerbContract } from '../step-verb/step-verb-contract';

export const resultsAnswerContract = z.object({
  instanceId: instanceIdContract,
  instanceState: instanceStateContract,
  runId: runIdContract.nullable(),
  kind: resultKindContract.nullable(),
  step: stepIndexContract.nullable(),
  verb: stepVerbContract.nullable(),
  prunedAtMs: epochMsContract.nullable(),
  prunedByRule: contentTextContract.nullable(),
  matched: readingCountContract,
  returned: readingCountContract,
  truncated: z.boolean(),
  rows: z.array(contentTextContract).readonly(),
  storedReturn: runResultContract.nullable(),
});

export type ResultsAnswer = z.infer<typeof resultsAnswerContract>;
