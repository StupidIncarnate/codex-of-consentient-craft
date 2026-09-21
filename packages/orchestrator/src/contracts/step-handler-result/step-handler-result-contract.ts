/**
 * PURPOSE: What a deterministic step's handler hands back — the classified `Outcome` (reusing
 * story 13's `stepOutcomeContract`, never a new word), the text a `repair` step is handed as
 * context, and the optional back-link (`wardResults/<id>`, `riftcarverResults/<id>`) the
 * execution panel resolves a row's detail through. All four handlers share this one shape, so
 * `stepHandlerRunBroker`'s dispatch table returns one type whichever handler it called.
 *
 * USAGE:
 * stepHandlerResultContract.parse({
 *   outcome: 'done',
 *   detail: 'run: 1780108054226-a080  lint: PASS',
 *   resultRef: 'wardResults/f47ac10b-58cc-4372-a567-0e02b2c3d479',
 * });
 * // Returns: StepHandlerResult
 */

import { z } from 'zod';

import { contentTextContract, relatedDataItemContract } from '@dungeonmaster/shared/contracts';

import { stepOutcomeContract } from '../step-outcome/step-outcome-contract';

export const stepHandlerResultContract = z
  .object({
    outcome: stepOutcomeContract,
    detail: contentTextContract,
    resultRef: relatedDataItemContract.optional(),
  })
  .strict();

export type StepHandlerResult = z.infer<typeof stepHandlerResultContract>;
