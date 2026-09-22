/**
 * PURPOSE: Resolves the agent prompt name from a work item's own STEP, for dispatch sites that
 * instruct the spawned session which prompt to fetch. A stepped work item reads its step prompt
 * (e.g. `codeweaver-planner`, `codeweaver-worker`, `spiritmender`) rather than its scope role.
 *
 * USAGE:
 * stepDispatchRoleTransformer({ quest, workItem });
 * // Returns { prompt: 'spiritmender' } for a wardFull `repair` work item
 * // Returns { prompt: 'codeweaver-worker' } for a codeweaver `work` work item
 * // Returns { prompt: null } for a deterministic step or a work item without a prompt step
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { workItemStepNodeTransformer } from '../work-item-step-node/work-item-step-node-transformer';

export const stepDispatchRoleTransformer = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): { prompt: AgentPromptName | null } => {
  const node = workItemStepNodeTransformer({ quest, workItem });

  // A DETERMINISTIC step names no prompt because it spawns no session — it runs a handler through
  // `stepHandlerRunBroker`. Answering for one would name a prompt for a dispatch that never happens.
  if (node === undefined || node.kind !== 'prompt' || node.prompt === undefined) {
    return { prompt: null };
  }

  return { prompt: agentPromptNameContract.parse(String(node.prompt)) };
};
