/**
 * PURPOSE: Defines a single entry in the cross-guild quest execution queue — one quest slot awaiting or actively running in the FIFO runner
 *
 * USAGE:
 * questQueueEntryContract.parse({
 *   questId, guildId, guildSlug, questTitle, status: 'in_progress', enqueuedAt: '2024-01-15T10:00:00.000Z',
 * });
 * // Returns: QuestQueueEntry
 */

import { z } from 'zod';

import { guildIdContract } from '../guild-id/guild-id-contract';
import { questIdContract } from '../quest-id/quest-id-contract';
import { questSourceContract } from '../quest-source/quest-source-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { sessionIdContract } from '../session-id/session-id-contract';
import { urlSlugContract } from '../url-slug/url-slug-contract';

export const questQueueEntryContract = z.object({
  questId: questIdContract,
  guildId: guildIdContract,
  guildSlug: urlSlugContract,
  questTitle: z.string().min(1).brand<'QuestTitle'>(),
  status: questStatusContract,
  questSource: questSourceContract.optional(),
  activeSessionId: sessionIdContract.optional(),
  enqueuedAt: z.string().datetime().brand<'IsoTimestamp'>(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  error: z
    .object({
      message: z.string().min(1).brand<'ErrorMessage'>(),
      at: z.string().datetime().brand<'IsoTimestamp'>(),
    })
    .optional(),
});

export type QuestQueueEntry = z.infer<typeof questQueueEntryContract>;
