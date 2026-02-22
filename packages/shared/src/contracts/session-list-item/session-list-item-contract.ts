/**
 * PURPOSE: Defines the SessionListItem structure for displaying all sessions across a guild
 *
 * USAGE:
 * sessionListItemContract.parse({sessionId: '9c4d8f1c-...', startedAt: '2024-01-15T10:00:00.000Z', active: true, agentRole: 'chaoswhisperer'});
 * // Returns: SessionListItem object
 */

import { z } from 'zod';

import { questIdContract } from '../quest-id/quest-id-contract';
import { sessionIdContract } from '../session-id/session-id-contract';

export const sessionListItemContract = z.object({
  sessionId: sessionIdContract,
  summary: z.string().brand<'SessionSummary'>().optional(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
  endedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  active: z.boolean(),
  agentRole: z.string().brand<'AgentRole'>(),
  questId: questIdContract.optional(),
  questTitle: z.string().brand<'QuestTitle'>().optional(),
  questStatus: z.string().brand<'QuestStatus'>().optional(),
});

export type SessionListItem = z.infer<typeof sessionListItemContract>;
