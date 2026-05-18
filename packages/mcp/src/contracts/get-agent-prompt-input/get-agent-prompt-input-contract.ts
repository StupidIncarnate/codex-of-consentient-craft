/**
 * PURPOSE: Defines the input schema for the MCP get-agent-prompt tool
 *
 * USAGE:
 * getAgentPromptInputContract.parse({ agent: 'codeweaver', questId, workItemId });
 * // Returns validated get-agent-prompt input
 */
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

export const getAgentPromptInputContract = z.object({
  agent: z
    .string()
    .min(1)
    .brand<'AgentPromptInputAgent'>()
    .describe('Agent name (e.g. chaoswhisperer-gap-minion, pathseeker-surface)'),
  workItemId: questWorkItemIdContract.describe(
    'Work item the calling sub-agent was dispatched against',
  ),
  questId: questIdContract.describe('Quest the calling sub-agent is working on'),
});

export type GetAgentPromptInput = z.infer<typeof getAgentPromptInputContract>;
