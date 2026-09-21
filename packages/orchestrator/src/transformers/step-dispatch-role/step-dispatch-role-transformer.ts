/**
 * PURPOSE: The agent role a work item's own STEP names, for a dispatch site that would otherwise
 * key on `workItem.role`. Reach for this at every site that spawns a session: a work item carries
 * the role of its SCOPE, so a `repair` step inside a `ward` scope reads `role: 'ward'` — a name
 * `agentRoleContract` refuses, which takes the whole dispatch scan down with it. The step already
 * declares the right answer, `prompt: 'spiritmender'`.
 *
 * USAGE:
 * stepDispatchRoleTransformer({ quest, workItem });
 * // Returns { role: 'spiritmender', declinedPrompt: null } for a wardFull `repair` work item
 * // Returns { role: null, declinedPrompt: 'codeweaver-worker' } for a codeweaver `work` work item
 *
 * `role: null` MEANS "DISPATCH ON THE WORK ITEM'S OWN ROLE", and every caller falls back to
 * `agentRoleContract.parse(workItem.role)` there. Three shapes answer null:
 *
 * - A step whose `prompt` NAMES A PROMPT NOTHING SERVES YET. `agentFlowStatics` declares
 *   `codeweaver-planner`, `codeweaver-worker`, `recipe-maker`, `flowrider-planner`,
 *   `flowrider-worker`, `siegemaster-reader`, `siege-planner`, the two siege walkers and the two
 *   siege fixers, and `agentPromptClassificationStatics.promptNames` holds none of them. Re-keying
 *   on one would throw on every codeweaver, flowrider and siegemaster dispatch — a wider outage
 *   than the one keying on the step fixes. THAT FALLBACK ENDS ON ITS OWN: registering those prompts
 *   as roles `agentRoleContract` enumerates makes the branch below take them, with nothing here to
 *   edit.
 * - A step whose `prompt` is a MINION name — `codeweaver-reviewer`, `flowrider-reviewer`. A minion
 *   is summoned inside its parent's turn and owns no work item, so no dispatch may spawn one;
 *   `agentRoleContract` refusing the name is the guard, not the gap.
 * - A work item running NO step graph at all — a hydrated ward, a chat role, a legacy carve. It
 *   answers `declinedPrompt: null` too, because no step named anything to decline.
 *
 * NEITHER DECLINE IS SILENT: `buildSpawnInstructionLayerBroker` writes `declinedPrompt` to stderr
 * on the dispatch that fell back, naming the step, the prompt and the role it used instead.
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import type { AgentPromptName } from '../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { agentRoleContract } from '../../contracts/agent-role/agent-role-contract';
import type { AgentRole } from '../../contracts/agent-role/agent-role-contract';
import { workItemStepNodeTransformer } from '../work-item-step-node/work-item-step-node-transformer';

export const stepDispatchRoleTransformer = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): { role: AgentRole | null; declinedPrompt: AgentPromptName | null } => {
  const node = workItemStepNodeTransformer({ quest, workItem });

  // A DETERMINISTIC step names no prompt because it spawns no session — it runs a handler through
  // `stepHandlerRunBroker`. Answering for one would name a role for a dispatch that never happens.
  if (node === undefined || node.kind !== 'prompt' || node.prompt === undefined) {
    return { role: null, declinedPrompt: null };
  }

  const dispatchable = agentRoleContract.safeParse(String(node.prompt));

  return dispatchable.success
    ? { role: dispatchable.data, declinedPrompt: null }
    : { role: null, declinedPrompt: agentPromptNameContract.parse(String(node.prompt)) };
};
