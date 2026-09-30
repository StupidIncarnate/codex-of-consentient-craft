/**
 * PURPOSE: Zod schema for post-edit responder result with violations and message
 *
 * USAGE:
 * const result = hookPostEditResponderResultContract.parse({ violations: [], message: 'No violations' });
 * // Returns validated HookPostEditResponderResult
 */
import { z } from '#gateway/npm/zod';
import { lintResultContract } from '../lint-result/lint-result-contract';

export const hookPostEditResponderResultContract = z.object({
  violations: z.array(lintResultContract),
  message: z.string().brand<'HookPostEditResponderResultMessage'>(),
}).brand<'HookPostEditResponderResult'>();

export type HookPostEditResponderResult = z.infer<typeof hookPostEditResponderResultContract>;
