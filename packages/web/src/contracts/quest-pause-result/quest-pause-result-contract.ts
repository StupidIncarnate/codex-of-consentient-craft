/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/pause. `fetchJson` resolves `unknown`; this is what the broker
 * parses its response through.
 *
 * USAGE:
 * questPauseResultContract.parse({ paused: true });
 * // Returns { paused: true }
 */

import { z } from 'zod';

export const questPauseResultContract = z.object({
  paused: z.boolean(),
});

export type QuestPauseResult = z.infer<typeof questPauseResultContract>;
