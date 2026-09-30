/**
 * PURPOSE: Defines the FrameOutcome shape that driver-serve-layer-responder builds
 *
 * USAGE:
 * frameOutcomeContract.parse(value);
 * // Returns validated FrameOutcome
 */
import { z } from '#gateway/npm/zod';
import { driverRequestContract } from '../driver-request/driver-request-contract';

export const frameOutcomeContract = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: driverRequestContract }).brand<'FrameOutcome'>(),
  z
    .object({ success: z.literal(false), message: z.string().brand<'FrameOutcomeMessage'>() })
    .brand<'FrameOutcome'>(),
]);

export type FrameOutcome = z.infer<typeof frameOutcomeContract>;
