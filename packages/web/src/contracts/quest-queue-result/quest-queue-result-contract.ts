/**
 * PURPOSE: Validates the wire body of GET /api/quests/queue. `fetchJson` resolves `unknown`; this is what
 * the broker parses its response through before unwrapping `entries`.
 *
 * USAGE:
 * questQueueResultContract.parse(body);
 * // Returns { entries: QuestQueueEntry[] }
 */

import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';
import { z } from '#gateway/npm/zod';

export const questQueueResultContract = z.object({
  entries: z.array(questQueueEntryContract),
});

export type QuestQueueResult = z.infer<typeof questQueueResultContract>;
