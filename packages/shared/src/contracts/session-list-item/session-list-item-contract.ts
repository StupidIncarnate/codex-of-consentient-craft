/**
 * PURPOSE: Defines the SessionListItem structure for displaying all sessions across a guild
 *
 * USAGE:
 * sessionListItemContract.parse({sessionId: '9c4d8f1c-...', startedAt: '2024-01-15T10:00:00.000Z'});
 * // Returns: SessionListItem object
 */

import { z } from '#gateway/npm/zod';

import { questContract } from '../quest/quest-contract';
import { sessionContract } from '../session/session-contract';

export const sessionListItemContract = z
  .object({
    sessionId: sessionContract.shape.id,
    summary: z.string().brand<'SessionListItemSummary'>().optional(),
    startedAt: z.iso.datetime().brand<'SessionListItemStartedAt'>(),
    questId: questContract.shape.id.optional(),
    questTitle: questContract.shape.title.optional(),
    questStatus: z.string().brand<'SessionListItemQuestStatus'>().optional(),
  })
  .brand<'SessionListItem'>();

export type SessionListItem = z.infer<typeof sessionListItemContract>;
