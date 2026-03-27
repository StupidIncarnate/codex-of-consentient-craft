/**
 * PURPOSE: Zod schema for pre-edit responder result indicating whether to block an edit
 *
 * USAGE:
 * const result = hookPreEditResponderResultContract.parse({ shouldBlock: false });
 * // Returns validated HookPreEditResponderResult
 */
import { z } from 'zod';

export const hookPreEditResponderResultContract = z.object({
  shouldBlock: z.boolean(),
  message: z.string().brand<'HookMessage'>().optional(),
  updatedCommand: z.string().brand<'BashCommand'>().optional(),
});

export type HookPreEditResponderResult = z.infer<typeof hookPreEditResponderResultContract>;
