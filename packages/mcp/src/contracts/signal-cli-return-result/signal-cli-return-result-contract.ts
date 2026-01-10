/**
 * PURPOSE: Defines the result schema for the signal-cli-return broker
 *
 * USAGE:
 * const result = signalCliReturnResultContract.parse({ success: true, signalPath: '/path/.cli-signal' });
 * // Returns validated result from the signal-cli-return broker
 */
import { z } from 'zod';
import { filePathContract } from '../file-path/file-path-contract';

export const signalCliReturnResultContract = z.object({
  success: z.boolean().brand<'SuccessFlag'>(),
  signalPath: filePathContract,
});

export type SignalCliReturnResult = z.infer<typeof signalCliReturnResultContract>;
