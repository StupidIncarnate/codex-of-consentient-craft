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
 * WHEN-TO-USE: `workItemId` is optional because a parent-summoned sub-agent minion (planner-minion,
 * worker-minion, reviewer-minion, chaoswhisperer-gap-minion) has no work item of its own — it
 * fetches its served methodology with `{ agent, questId }` only. The orchestrator broker enforces
 * that role names (dispatched as their own work item) DO supply a workItemId.
 *
 * This is a SERVED schema — an agent reads the `discipline` names out of it and passes one back — so
 * a list that drifts from the orchestrator's own `disciplineContract` publishes a value
 * `agentPromptGetBroker` then refuses, and nothing in either package would fail until an agent tried
 * it. `DISCIPLINE_NAMES` is therefore pinned with `satisfies readonly Discipline[]`: a rename or a
 * removal on the orchestrator side fails THIS package's typecheck. The pin is a TYPE import rather
 * than reading `disciplineContract.options` at runtime because this package module-mocks
 * `@dungeonmaster/orchestrator` wholesale in its adapter proxies — a value imported from that barrel
 * reads as `undefined` inside every unit test here, which would collapse this enum to "matches
 * nothing" and reject the very calls it exists to accept.
 */
import type { Discipline } from '@dungeonmaster/orchestrator';
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

const DISCIPLINE_NAMES = [
  'implementation',
  'bug-repro',
  'below-browser',
  'browser-e2e',
  'manual-qa',
] as const satisfies readonly Discipline[];

export const getAgentPromptInputContract = z.object({
  agent: z
    .string()
    .min(1)
    .brand<'AgentPromptInputAgent'>()
    .describe('Agent name (e.g. codeweaver, planner-minion, reviewer-minion)'),
  workItemId: questWorkItemIdContract
    .optional()
    .describe(
      'Work item the calling sub-agent was dispatched against (omitted by summoned minions)',
    ),
  questId: questIdContract.describe('Quest the calling sub-agent is working on'),
  discipline: z
    .enum(DISCIPLINE_NAMES)
    .optional()
    .describe(
      "Which discipline pack fills the shared prompt template's $DISCIPLINE placeholder. REQUIRED for planner-minion / worker-minion / reviewer-minion — those fetch with { agent, questId } only and have no workItemId to derive a discipline from. MUST be OMITTED for an operator role, whose discipline is derived server-side from its own role, and for chaoswhisperer-gap-minion.",
    ),
});

export type GetAgentPromptInput = z.infer<typeof getAgentPromptInputContract>;
