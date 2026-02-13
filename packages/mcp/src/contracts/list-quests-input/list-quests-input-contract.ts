/**
 * PURPOSE: Defines the input schema for the MCP list-quests tool
 *
 * USAGE:
 * const input: ListQuestsInput = listQuestsInputContract.parse({ projectId: 'f47ac10b-...' });
 * // Returns validated ListQuestsInput with projectId
 */
import { z } from 'zod';

export const listQuestsInputContract = z
  .object({
    projectId: z.string().uuid().describe('The project ID to list quests for').brand<'ProjectId'>(),
  })
  .brand<'ListQuestsInput'>();

export type ListQuestsInput = z.infer<typeof listQuestsInputContract>;
