/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/start across both server response
 * shapes (200 success, 4xx/5xx error) in one permissive object, so questStartBroker can safeParse
 * the body once and branch on the response's `ok` flag rather than on body shape.
 *
 * USAGE:
 * questStartResponseContract.safeParse({ processId: 'proc-1' });
 * // Returns success with the 200 success shape
 * questStartResponseContract.safeParse({ error: 'quest/add-auth-7bc217a1 already exists — name is in use by other work' });
 * // Returns success with the error shape
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

export const questStartResponseContract = z.object({
  processId: processIdContract.optional(),
  error: z.string().min(1).brand<'QuestStartErrorMessage'>().optional(),
});

export type QuestStartResponse = z.infer<typeof questStartResponseContract>;
