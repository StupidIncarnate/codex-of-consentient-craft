/**
 * PURPOSE: Defines the structure of a quest outbox line containing quest ID and timestamp
 *
 * USAGE:
 * questOutboxLineContract.parse({ questId: 'add-auth', timestamp: '2024-01-15T10:00:00.000Z' });
 * // Returns validated QuestOutboxLine object
 */

import { z } from 'zod';

import { questIdContract } from '@dungeonmaster/shared/contracts';

export const questOutboxLineContract = z.object({
  questId: questIdContract,
  timestamp: z.string().datetime().brand<'QuestOutboxTimestamp'>(),
});

export type QuestOutboxLine = z.infer<typeof questOutboxLineContract>;
