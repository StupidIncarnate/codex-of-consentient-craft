/**
 * PURPOSE: Zod schema for pre-edit responder result indicating whether to block an edit
 *
 * USAGE:
 * const result = hookPreEditResponderResultContract.parse({ shouldBlock: false });
 * // Returns validated HookPreEditResponderResult
 */
import { z } from '#gateway/npm/zod';

export const hookPreEditResponderResultContract = z
  .object({
    shouldBlock: z.boolean(),
    message: z.string().brand<'HookPreEditResponderResultMessage'>().optional(),
    updatedCommand: z.string().brand<'HookPreEditResponderResultUpdatedCommand'>().optional(),
    updatedTimeout: z
      .number()
      .int()
      .positive()
      .brand<'HookPreEditResponderResultUpdatedTimeout'>()
      .optional(),
  })
  .brand<'HookPreEditResponderResult'>();

export type HookPreEditResponderResult = z.infer<typeof hookPreEditResponderResultContract>;
