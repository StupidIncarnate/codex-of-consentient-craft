/**
 * PURPOSE: Defines the input schema for the MCP get-agent-prompt tool
 *
 * USAGE:
 * getAgentPromptInputContract.parse({ agent: 'codeweaver', questId, workItemId });
 * // Returns validated get-agent-prompt input
 *
 * WHEN-TO-USE: `workItemId` is optional because a parent-summoned sub-agent minion (e.g.
 * chaoswhisperer-gap-minion, pathseeker-surface, codeweaver-minion) has no work item of its own —
 * it fetches its served methodology with `{ agent, questId }` only. The orchestrator broker enforces
 * that role names (dispatched as their own work item) DO supply a workItemId.
 */
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

export const getAgentPromptInputContract = z.object({
  agent: z
    .string()
    .min(1)
    .brand<'AgentPromptInputAgent'>()
    .describe('Agent name (e.g. chaoswhisperer-gap-minion, pathseeker-surface)'),
  workItemId: questWorkItemIdContract
    .optional()
    .describe(
      'Work item the calling sub-agent was dispatched against (omitted by summoned minions)',
    ),
  questId: questIdContract.describe('Quest the calling sub-agent is working on'),
});

export type GetAgentPromptInput = z.infer<typeof getAgentPromptInputContract>;
