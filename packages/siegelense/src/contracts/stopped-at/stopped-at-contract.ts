/**
 * PURPOSE: Where a `run` batch stopped — the step, the verb, a rendered error and, for an AMBIGUOUS
 * failure, every candidate that matched — so recovery costs no extra turn
 * (siegelense-tooling.md line 2870: "A failing return carries the key where it stopped"). Reach for
 * this over StepReading whenever the value is the run's OWN verdict about why it halted;
 * StepReading is one line of the transcript for a step that already ran, while a StoppedAt exists
 * only on the step that ended the batch. `candidates` is always an array, empty for every failure
 * that is not an AMBIGUOUS match, so a reader never branches on whether the field is present before
 * reading its length.
 *
 * USAGE:
 * stoppedAtContract.parse({
 *   step: 4,
 *   verb: 'click',
 *   error: 'AMBIGUOUS: 2 elements match [data-testid="PIXEL_BTN"]',
 *   candidates: [],
 * });
 * // Returns a validated StoppedAt
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { stepCandidateContract } from '../step-candidate/step-candidate-contract';
import { stepIndexContract } from '../step-index/step-index-contract';
import { stepVerbContract } from '../step-verb/step-verb-contract';

export const stoppedAtContract = z.object({
  step: stepIndexContract,
  verb: stepVerbContract,
  error: contentTextContract,
  candidates: z.array(stepCandidateContract).readonly(),
});

export type StoppedAt = z.infer<typeof stoppedAtContract>;
