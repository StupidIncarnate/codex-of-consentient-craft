/**
 * PURPOSE: Defines the SessionListItem structure for displaying all sessions across a guild
 *
 * USAGE:
 * sessionListItemContract.parse({sessionId: '9c4d8f1c-...', startedAt: '2024-01-15T10:00:00.000Z'});
 * // Returns: SessionListItem object
 */

import { z } from 'zod';

import { questIdContract } from '../quest-id/quest-id-contract';
import { sessionIdContract } from '../session-id/session-id-contract';

export const sessionListItemContract = z.object({
  sessionId: sessionIdContract,
  summary: z.string().brand<'SessionSummary'>().optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
  questId: questIdContract.optional(),
  questTitle: z.string().brand<'QuestTitle'>().optional(),
  questStatus: z.string().brand<'QuestStatus'>().optional(),
});

export type SessionListItem = z.infer<typeof sessionListItemContract>;
