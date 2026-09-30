/**
 * PURPOSE: Defines the structure of a quest outbox line containing quest ID and timestamp
 *
 * USAGE:
 * questOutboxLineContract.parse({ questId: 'add-auth', timestamp: '2024-01-15T10:00:00.000Z' });
 * // Returns validated QuestOutboxLine object
 */

import { z } from '#gateway/npm/zod';

import { questContract } from '@dungeonmaster/shared/contracts';

export const questOutboxLineContract = z.object({
  questId: questContract.shape.id,
  timestamp: z.iso.datetime().brand<'QuestOutboxTimestamp'>(),
}).brand<'QuestOutboxLine'>();

export type QuestOutboxLine = z.infer<typeof questOutboxLineContract>;
