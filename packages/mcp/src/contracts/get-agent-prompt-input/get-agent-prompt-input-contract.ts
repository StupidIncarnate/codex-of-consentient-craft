/**
 * PURPOSE: Defines the input schema for the MCP get-agent-prompt tool
 *
 * USAGE:
 * getAgentPromptInputContract.parse({ agent: 'codeweaver', questId, workItemId });
 * // Returns validated get-agent-prompt input for a relay role
 *
 * getAgentPromptInputContract.parse({ agent: 'codeweaver-reviewer', questId });
 * // Returns validated get-agent-prompt input for a minion, which has no work item of its own
 *
 * WHEN-TO-USE: `workItemId` is optional because a parent-summoned minion has no work item — it
 * fetches with `{ agent, questId }` only, and its parent briefs its context inline. The
 * orchestrator broker enforces the other half: a ROLE name, dispatched as its own work item, must
 * supply one, and a minion that passes one is refused by name.
 *
 * THERE IS NO `discipline` ARGUMENT. Every prompt is one file named for whose it is —
 * `codeweaver-reviewer`, `siegemaster-walker`, and so on — so the agent name alone selects the text.
 */
import { z } from 'zod';

import { questIdContract, questWorkItemIdContract } from '@dungeonmaster/shared/contracts';

export const getAgentPromptInputContract = z.object({
  agent: z
    .string()
    .min(1)
    .brand<'AgentPromptInputAgent'>()
    .describe(
      'Agent name. A relay role (codeweaver, flowrider, siegemaster, spiritmender, warpgate) or a minion named for the role that summons it (e.g. codeweaver-reviewer, siegemaster-walker).',
    ),
  workItemId: questWorkItemIdContract
    .optional()
    .describe(
      "Work item the calling sub-agent was dispatched against. Supplied by a relay role; OMITTED by a summoned minion, which has no work item of its own and is refused if it passes its parent's.",
    ),
  questId: questIdContract.describe('Quest the calling sub-agent is working on'),
});

export type GetAgentPromptInput = z.infer<typeof getAgentPromptInputContract>;
