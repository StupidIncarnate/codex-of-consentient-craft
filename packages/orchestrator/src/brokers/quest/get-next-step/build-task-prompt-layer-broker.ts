/**
 * PURPOSE: Layer helper for questGetNextStepBroker — builds the verbatim taskPrompt string the orchestrator dispatches to each sub-agent via Task(), interpolating role + questId + workItemId per the plan's "Sub-agent Task prompt shape" section
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
}: {
  role: AgentRole;
  workItemId: QuestWorkItemId;
  questId: QuestId;
}): PromptText =>
  promptTextContract.parse(
    `Call mcp__dungeonmaster__get-agent-prompt({\n  agent: "${role}",\n  workItemId: "${workItemId}",\n  questId: "${questId}"\n}) and follow its instructions exactly. When done, call mcp__dungeonmaster__signal-back({\n  questId: "${questId}",\n  workItemId: "${workItemId}",\n  signal: "complete" | "failed",\n  summary: "<one-line>"\n}).`,
  );
