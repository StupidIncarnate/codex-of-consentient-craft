/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/clarify: the id of the chat process
 * the answers were handed to. `fetchJson` resolves `unknown`; this is what `questClarifyBroker`
 * parses its response through.
 *
 * USAGE:
 * questClarifyResultContract.parse({ chatProcessId: 'clarify-proc-1' });
 * // Returns { chatProcessId: ProcessId }
 */

import { processIdContract } from '@dungeonmaster/shared/contracts';
import { z } from 'zod';

export const questClarifyResultContract = z.object({
  chatProcessId: processIdContract,
});

export type QuestClarifyResult = z.infer<typeof questClarifyResultContract>;
