/**
 * PURPOSE: Zod schema for post-edit responder result with violations and message
 *
 * USAGE:
 * const result = hookPostEditResponderResultContract.parse({ violations: [], message: 'No violations' });
 * // Returns validated HookPostEditResponderResult
 */
import { z } from 'zod';
import { lintResultContract } from '../lint-result/lint-result-contract';
import { messageContract } from '../message/message-contract';

export const hookPostEditResponderResultContract = z.object({
  violations: z.array(lintResultContract),
  message: messageContract,
});

export type HookPostEditResponderResult = z.infer<typeof hookPostEditResponderResultContract>;
