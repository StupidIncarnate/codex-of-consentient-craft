/**
 * PURPOSE: Validates the response body from `GET /api/quests/by-session/:sessionId`. The endpoint returns the questId of the quest whose chaoswhisperer workItem matches the given Claude Code session id. The hook treats the response as opaque (path-segment-substituted into a PATCH URL), so questId is only required to be a non-empty string — no UUID branding here so test fixtures stay readable.
 *
 * USAGE:
 * questBySessionResponseContract.parse({ questId: 'abc-123' });
 * // Returns { questId } where questId is a non-empty branded string.
 */

import { z } from 'zod';

export const questBySessionResponseContract = z.object({
  questId: z.string().min(1).brand<'QuestBySessionQuestId'>(),
});

export type QuestBySessionResponse = z.infer<typeof questBySessionResponseContract>;
