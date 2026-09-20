/**
 * PURPOSE: The arguments a quest's `withWardResultDetail` extra takes — which ward result's sibling
 * detail file to write, and the JSON blob to put in it. `wardResultId` is drawn straight off
 * `wardResultContract.shape.id` rather than re-typed by hand: it is the exact id a
 * `ward-results/<id>.json` file is named for, and it is what `quest-ward-detail-params-contract` and
 * `ward-detail-response-contract` each already inline as the same zod chain, so deriving from the
 * one OBJECT contract that owns the field is the closest this repo gets to a canonical source.
 *
 * USAGE:
 * wardResultDetailArgsContract.parse({
 *   wardResultId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
 *   detail: { testFailures: [] },
 * });
 * // Returns WardResultDetailArgs
 */
import { z } from 'zod';

import { wardResultContract } from '@dungeonmaster/shared/contracts';

export const wardResultDetailArgsContract = z.object({
  wardResultId: wardResultContract.shape.id,
  detail: z.record(z.unknown()),
});

export type WardResultDetailArgs = z.infer<typeof wardResultDetailArgsContract>;
