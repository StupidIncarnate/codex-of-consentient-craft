/**
 * PURPOSE: Defines the QuestSource enum discriminating how a quest was created (real user vs smoketest suite)
 *
 * USAGE:
 * questSourceContract.parse('user');
 * // Returns: 'user' as QuestSource
 *
 * A 'user' quest is created through the real quest flow (chat, MCP start-quest, etc).
 * 'smoketest-*' values tag quests hydrated by the corresponding smoketest suite runner so they
 * can be bulk-cleared between suite runs without touching real quests.
 */

import { z } from 'zod';

export const questSourceContract = z.enum([
  'user',
  'smoketest-mcp',
  'smoketest-signals',
  'smoketest-orchestration',
]);

export type QuestSource = z.infer<typeof questSourceContract>;
