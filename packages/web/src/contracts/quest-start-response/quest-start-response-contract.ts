/**
 * PURPOSE: Defines the response contract for the quest start API endpoint containing a process ID
 *
 * USAGE:
 * questStartResponseContract.parse({processId: 'proc-12345'});
 * // Returns validated {processId: ProcessId} object
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

export const questStartResponseContract = z.object({
  processId: processIdContract,
});

export type QuestStartResponse = z.infer<typeof questStartResponseContract>;
