/**
 * PURPOSE: Defines the input schema for the MCP get-quest-status tool
 *
 * USAGE:
 * const input: GetQuestStatusInput = getQuestStatusInputContract.parse({ processId: 'proc-123' });
 * // Returns validated GetQuestStatusInput with processId
 */
import { z } from 'zod';

export const getQuestStatusInputContract = z
  .object({
    processId: z
      .string()
      .min(1)
      .describe('The process ID returned from start-quest')
      .brand<'ProcessId'>(),
  })
  .brand<'GetQuestStatusInput'>();

export type GetQuestStatusInput = z.infer<typeof getQuestStatusInputContract>;
