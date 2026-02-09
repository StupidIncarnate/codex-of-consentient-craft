/**
 * PURPOSE: Defines the input schema for the MCP list-quests tool
 *
 * USAGE:
 * const input: ListQuestsInput = listQuestsInputContract.parse({ startPath: '/my/project' });
 * // Returns validated ListQuestsInput with startPath
 */
import { z } from 'zod';

export const listQuestsInputContract = z
  .object({
    startPath: z
      .string()
      .min(1)
      .describe('The path to start searching for quests from')
      .brand<'FilePath'>()
      .optional(),
  })
  .brand<'ListQuestsInput'>();

export type ListQuestsInput = z.infer<typeof listQuestsInputContract>;
