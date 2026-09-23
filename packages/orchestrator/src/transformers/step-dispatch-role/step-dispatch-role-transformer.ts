/**
 * PURPOSE: Resolves the agent prompt name AND the Claude CLI model from a work item's own STEP, for
 * dispatch sites that instruct the spawned session which prompt to fetch and which model to run it
 * on. A stepped work item reads its step's own prompt (e.g. `codeweaver-planner`,
 * `codeweaver-worker`, `spiritmender`) rather than its scope role, and its step's own declared
 * `model` rather than a role default — see `agentStepNodeContract`'s header for why the two live on
 * the same node.
 *
 * USAGE:
 * stepDispatchRoleTransformer({ quest, workItem });
 * // Returns { prompt: 'spiritmender', model: 'sonnet' } for a wardFull `repair` work item
 * // Returns { prompt: 'codeweaver-worker', model: 'sonnet' } for a codeweaver `work` work item
 * // Returns { prompt: null, model: undefined } for a deterministic step or a work item without a
 * // prompt step — the caller falls back to its own scope-role model.
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import type { ClaudeModel } from '../../contracts/claude-model/claude-model-contract';
import { workItemStepNodeTransformer } from '../work-item-step-node/work-item-step-node-transformer';

export const stepDispatchRoleTransformer = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): { prompt: AgentPromptName | null; model: ClaudeModel | undefined } => {
  const node = workItemStepNodeTransformer({ quest, workItem });

  // A DETERMINISTIC step names no prompt because it spawns no session — it runs a handler through
  // `stepHandlerRunBroker`. Answering for one would name a prompt for a dispatch that never happens,
  // and a model for a session nothing spawns.
  if (node === undefined || node.kind !== 'prompt' || node.prompt === undefined) {
    return { prompt: null, model: undefined };
  }

  return { prompt: agentPromptNameContract.parse(String(node.prompt)), model: node.model };
};
