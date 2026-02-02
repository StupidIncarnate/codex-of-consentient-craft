/**
 * PURPOSE: Defines the output schema for the MCP start-quest tool result
 *
 * USAGE:
 * const result: StartQuestResult = startQuestResultContract.parse({ success: true, processId: 'proc-123' });
 * // Returns validated StartQuestResult with success status and processId or error
 */
import { z } from 'zod';

export const startQuestResultContract = z
  .object({
    success: z.boolean(),
    processId: z.string().brand<'ProcessId'>().optional(),
    error: z.string().brand<'ErrorMessage'>().optional(),
  })
  .brand<'StartQuestResult'>();

export type StartQuestResult = z.infer<typeof startQuestResultContract>;
