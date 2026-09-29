/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/followup/stop. `fetchJson` resolves `unknown`; this is what the broker
 * parses its response through.
 *
 * USAGE:
 * questFollowupStopResultContract.parse({ stopped: true });
 * // Returns { stopped: true }
 */

import { z } from '#gateway/npm/zod';

export const questFollowupStopResultContract = z.object({
  stopped: z.boolean(),
});

export type QuestFollowupStopResult = z.infer<typeof questFollowupStopResultContract>;
