/**
 * PURPOSE: Validates the wire body of DELETE /api/quests/:questId — a single `deleted` flag
 * confirming the quest was removed. `fetchJson` resolves `unknown`; this is what
 * `questDeleteBroker` parses its response through.
 *
 * USAGE:
 * questDeleteResultContract.parse({ deleted: true });
 * // Returns { deleted: true }
 */

import { z } from 'zod';

export const questDeleteResultContract = z.object({
  deleted: z.boolean(),
});

export type QuestDeleteResult = z.infer<typeof questDeleteResultContract>;
