/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/chat across both server response
 * shapes (200 success, 4xx/5xx error) in one permissive object, so questChatBroker can safeParse the
 * body once and branch on the response's `ok` flag rather than on body shape.
 *
 * USAGE:
 * questChatResponseContract.safeParse({ chatProcessId: 'proc-1' });
 * // Returns success with the 200 success shape
 * questChatResponseContract.safeParse({ error: 'Quest is not accepting messages' });
 * // Returns success with the error shape
 */

import { z } from '#gateway/npm/zod';


export const questChatResponseContract = z.object({
  chatProcessId: z.string().min(1).brand<'QuestChatResponseChatProcessId'>().optional(),
  error: z.string().min(1).brand<'QuestChatErrorMessage'>().optional(),
}).brand<'QuestChatResponse'>();

export type QuestChatResponse = z.infer<typeof questChatResponseContract>;
