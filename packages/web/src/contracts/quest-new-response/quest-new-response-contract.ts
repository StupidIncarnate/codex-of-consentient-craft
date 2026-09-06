/**
 * PURPOSE: Validates the wire body of POST /api/guilds/:guildId/quests across both server response
 * shapes (200 success, 4xx/5xx error) in one permissive object, so questNewBroker can safeParse the
 * body once and branch on the response's `ok` flag rather than on body shape.
 *
 * USAGE:
 * questNewResponseContract.safeParse({ questId: 'quest-1', chatProcessId: 'proc-1' });
 * // Returns success with the 200 success shape
 * questNewResponseContract.safeParse({ error: 'Guild not found' });
 * // Returns success with the error shape
 */

import { z } from 'zod';

import { processIdContract, questIdContract } from '@dungeonmaster/shared/contracts';

export const questNewResponseContract = z.object({
  questId: questIdContract.optional(),
  chatProcessId: processIdContract.optional(),
  error: z.string().min(1).brand<'QuestNewErrorMessage'>().optional(),
});

export type QuestNewResponse = z.infer<typeof questNewResponseContract>;
