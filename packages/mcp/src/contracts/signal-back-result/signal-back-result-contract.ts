/**
 * PURPOSE: Defines the result schema for the signal-back broker
 *
 * USAGE:
 * const result = signalBackResultContract.parse({ success: true, signal: {...} });
 * // Returns validated result from the signal-back broker
 */
import { z } from '#gateway/npm/zod';
import { signalBackInputContract } from '../signal-back-input/signal-back-input-contract';

export const signalBackResultContract = z
  .object({
    success: z.boolean(),
    signal: signalBackInputContract,
  })
  .brand<'SignalBackResult'>();

export type SignalBackResult = z.infer<typeof signalBackResultContract>;
