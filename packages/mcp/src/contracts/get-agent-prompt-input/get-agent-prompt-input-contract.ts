/**
 * PURPOSE: Defines the input schema for the MCP get-agent-prompt tool
 *
 * USAGE:
 * getAgentPromptInputContract.parse({ agent: 'codeweaver', questId, workItemId });
 * // Returns validated get-agent-prompt input
 *
 * getAgentPromptInputContract.parse({ agent: 'worker-minion', questId, discipline: 'implementation' });
 * // Returns validated get-agent-prompt input for a minion, which has no workItemId to derive a
 * // discipline from
 *
 * WHEN-TO-USE: `workItemId` is optional because a parent-summoned sub-agent minion (e.g.
 * chaoswhisperer-gap-minion, pathseeker-surface, codeweaver-piece-minion) has no work item of its
 * own — it fetches its served methodology with `{ agent, questId }` only. The orchestrator broker
 * enforces that role names (dispatched as their own work item) DO supply a workItemId.
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
  discipline: z
    .enum(['implementation', 'bug-repro', 'below-browser', 'browser-e2e', 'manual-qa'])
    .optional()
    .describe(
      "Which discipline pack fills the shared prompt template's $DISCIPLINE placeholder. REQUIRED for planner-minion / worker-minion / reviewer-minion — those fetch with { agent, questId } only and have no workItemId to derive a discipline from. MUST be OMITTED for an orchestrator role, whose discipline is derived server-side from its own role, and for chaoswhisperer-gap-minion.",
    ),
});

export type GetAgentPromptInput = z.infer<typeof getAgentPromptInputContract>;
