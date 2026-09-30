/**
 * PURPOSE: Defines the RunPayloadOutcome shape that driver-handle-request-broker builds
 *
 * USAGE:
 * runPayloadOutcomeContract.parse(value);
 * // Returns validated RunPayloadOutcome
 */
import { z } from '#gateway/npm/zod';
import { runRequestContract } from '../run-request/run-request-contract';

export const runPayloadOutcomeContract = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: runRequestContract }).brand<'RunPayloadOutcome'>(),
  z
    .object({ success: z.literal(false), message: z.string().brand<'RunPayloadOutcomeMessage'>() })
    .brand<'RunPayloadOutcome'>(),
]);

export type RunPayloadOutcome = z.infer<typeof runPayloadOutcomeContract>;
