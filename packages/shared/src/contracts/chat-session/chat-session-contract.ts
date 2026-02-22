/**
 * PURPOSE: Defines the ChatSession structure for tracking agent chat sessions on guilds and quests
 *
 * USAGE:
 * chatSessionContract.parse({sessionId: '9c4d8f1c-...', agentRole: 'PathSeeker', startedAt: '2024-01-15T10:00:00.000Z', active: true});
 * // Returns: ChatSession object
 */

import { z } from 'zod';

import { sessionIdContract } from '../session-id/session-id-contract';

export const chatSessionContract = z.object({
  sessionId: sessionIdContract,
  agentRole: z.string().brand<'AgentRole'>(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>(),
  endedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  active: z.boolean().default(false),
  summary: z.string().brand<'SessionSummary'>().optional(),
});

export type ChatSession = z.infer<typeof chatSessionContract>;
