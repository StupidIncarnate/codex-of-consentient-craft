/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/followup across both server
 * response shapes (200 success, 4xx/5xx error) in one permissive object, so questFollowupBroker
 * can safeParse the body once and branch on the response's `ok` flag rather than on body shape.
 *
 * USAGE:
 * questFollowupResponseContract.safeParse({ chatProcessId: 'proc-1' });
 * // Returns success with the 200 success shape
 * questFollowupResponseContract.safeParse({ error: 'Quest must be blocked, complete or merged for follow-up' });
 * // Returns success with the error shape
 */

import { z } from 'zod';

import { processIdContract } from '@dungeonmaster/shared/contracts';

export const questFollowupResponseContract = z.object({
  chatProcessId: processIdContract.optional(),
  error: z.string().min(1).brand<'QuestFollowupErrorMessage'>().optional(),
});

export type QuestFollowupResponse = z.infer<typeof questFollowupResponseContract>;
