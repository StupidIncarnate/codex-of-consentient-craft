/**
 * PURPOSE: Defines the output schema for the MCP get-quest-status tool result
 *
 * USAGE:
 * const result: GetQuestStatusResult = getQuestStatusResultContract.parse({ success: true, status: {...} });
 * // Returns validated GetQuestStatusResult with success status and orchestration status or error
 */
import { z } from 'zod';

import { orchestrationStatusContract } from '@dungeonmaster/shared/contracts';

export const getQuestStatusResultContract = z
  .object({
    success: z.boolean(),
    status: orchestrationStatusContract.optional(),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'GetQuestStatusResult'>();

export type GetQuestStatusResult = z.infer<typeof getQuestStatusResultContract>;
