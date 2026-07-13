/**
 * PURPOSE: Layer helper for questGetNextStepBroker — builds the verbatim taskPrompt string the
 * orchestrator dispatches to each sub-agent, interpolating role + questId + workItemId. The
 * `resume` variant is dispatched by Node dispatch when it resumes an orphaned session
 * (`claude --resume`): the session already has its context, so the prompt only asks it to finish
 * and signal back.
 *
 * USAGE:
 * const taskPrompt = buildTaskPromptLayerBroker({ role, workItemId, questId });
 * // Returns: PromptText — branded string containing the get-agent-prompt + signal-back call template.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import type { AgentRole } from '../../../contracts/agent-role/agent-role-contract';
import {
  promptTextContract,
  type PromptText,
} from '../../../contracts/prompt-text/prompt-text-contract';

export const buildTaskPromptLayerBroker = ({
  role,
  workItemId,
  questId,
  resume,
}: {
  role: AgentRole;
  workItemId: QuestWorkItemId;
  questId: QuestId;
  resume?: boolean;
}): PromptText => {
  if (resume === true) {
    return promptTextContract.parse(
      `Your previous session for this work item was interrupted — you already have its context above. Verify what you completed (git status + recent commits), finish the remaining scope of your operation item, commit a prose handoff, then call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}). If you no longer have context, call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${role}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions.`,
    );
  }

  return promptTextContract.parse(
    `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${role}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete",\n  operationItemId: "<your operation item id>",\n  operationStatus: "done" | "partial"\n}).`,
  );
};
