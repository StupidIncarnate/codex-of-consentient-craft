/**
 * PURPOSE: One line of `runs/run_N.jsonl`, flushed as it ran (siegelense-tooling.md line 2554:
 * "`steps` is the transcript — every step with its verb, its arguments and its reading, flushed as
 * it ran"). Reach for this over StoppedAt: every step in a run produces one StepReading, whether it
 * succeeded or not, while a StoppedAt exists only on the ONE step that ended the batch. `shot` is
 * `null` for a non-acting step (`waitFor`, `eval`) that took no screenshot, never an absent key —
 * these lines are written to disk and read back, so a step that captured nothing must say so rather
 * than merely omit the field.
 *
 * USAGE:
 * stepReadingContract.parse({
 *   step: 2, verb: 'click', node: null, ok: true, expected: 'ok',
 *   reading: 'clicked [data-testid="GUILD_ADD"]', shot: '/repo/.siegelense/…/run_2/step2.png',
 *   startedAtMs: 1700000000000, endedAtMs: 1700000000210,
 * });
 * // Returns a validated StepReading
 */

import { z } from 'zod';

import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { nodeLabelContract } from '../node-label/node-label-contract';
import { stepExpectationContract } from '../step-expectation/step-expectation-contract';
import { stepIndexContract } from '../step-index/step-index-contract';
import { stepVerbContract } from '../step-verb/step-verb-contract';

export const stepReadingContract = z.object({
  step: stepIndexContract,
  verb: stepVerbContract,
  node: nodeLabelContract.nullable(),
  ok: z.boolean(),
  expected: stepExpectationContract,
  reading: contentTextContract,
  shot: absoluteFilePathContract.nullable(),
  startedAtMs: epochMsContract,
  endedAtMs: epochMsContract,
});

export type StepReading = z.infer<typeof stepReadingContract>;
