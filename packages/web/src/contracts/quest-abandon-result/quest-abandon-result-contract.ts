/**
 * PURPOSE: Validates the wire body of POST /api/quests/:questId/abandon — a single `abandoned` flag
 * confirming the quest was abandoned. `fetchJson` resolves `unknown`; this is what
 * `questAbandonBroker` parses its response through.
 *
 * USAGE:
 * questAbandonResultContract.parse({ abandoned: true });
 * // Returns { abandoned: true }
 */

import { z } from 'zod';

export const questAbandonResultContract = z.object({
  abandoned: z.boolean(),
});

export type QuestAbandonResult = z.infer<typeof questAbandonResultContract>;
