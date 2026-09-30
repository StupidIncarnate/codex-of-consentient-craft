/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/clarify: the id of the chat process
 * the answers were handed to. `fetchJson` resolves `unknown`; this is what `questClarifyBroker`
 * parses its response through.
 *
 * USAGE:
 * questClarifyResultContract.parse({ chatProcessId: 'clarify-proc-1' });
 * // Returns { chatProcessId: ProcessId }
 */

import { z } from '#gateway/npm/zod';

export const questClarifyResultContract = z.object({
  chatProcessId: z.string().min(1).brand<'QuestClarifyResultChatProcessId'>(),
});

export type QuestClarifyResult = z.infer<typeof questClarifyResultContract>;
