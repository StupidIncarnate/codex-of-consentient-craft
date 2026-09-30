/**
 * PURPOSE: Defines a single entry in the cross-guild quest execution queue — one quest slot awaiting or actively running in the FIFO runner
 *
 * USAGE:
 * questQueueEntryContract.parse({
 *   questId, guildId, guildSlug, questTitle, status: 'in_progress', enqueuedAt: '2024-01-15T10:00:00.000Z',
 * });
 * // Returns: QuestQueueEntry
 */

import { z } from '#gateway/npm/zod';

import { questSourceContract } from '../quest-source/quest-source-contract';
import { questStatusContract } from '../quest-status/quest-status-contract';
import { questContract } from '../quest/quest-contract';
import { guildContract } from '../guild/guild-contract';
import { sessionContract } from '../session/session-contract';

export const questQueueEntryContract = z.object({
  questId: questContract.shape.id,
  guildId: guildContract.shape.id,
  guildSlug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).brand<'QuestQueueEntryGuildSlug'>(),
  questTitle: z.string().min(1).brand<'QuestQueueEntryQuestTitle'>(),
  status: questStatusContract,
  questSource: questSourceContract.optional(),
  activeSessionId: sessionContract.shape.id.optional(),
  enqueuedAt: z.iso.datetime().brand<'QuestQueueEntryEnqueuedAt'>(),
  startedAt: z.iso.datetime().brand<'QuestQueueEntryStartedAt'>().optional(),
  error: z
    .object({
      message: z.string().min(1).brand<'QuestQueueEntryErrorMessage'>(),
      at: z.iso.datetime().brand<'QuestQueueEntryErrorAt'>(),
    })
    .optional(),
}).brand<'QuestQueueEntry'>();

export type QuestQueueEntry = z.infer<typeof questQueueEntryContract>;
