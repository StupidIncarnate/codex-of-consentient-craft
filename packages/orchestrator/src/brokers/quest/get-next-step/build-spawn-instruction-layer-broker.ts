/**
 * PURPOSE: Layer helper for questGetNextStepBroker — converts a single WorkItem + its quest's id
 * into a fully-formed SpawnInstruction, parsing the work-item role into an AgentRole and
 * interpolating the taskPrompt template.
 *
 * NEVER CLOBBER A SESSION. A retained `sessionId` is work already done, so ANY work item that has
 * one is re-dispatched as a resume (`resumeSessionId` + the resume-variant prompt) regardless of
 * role — no `resume` marker required. Relying on that marker meant an item whose session was
 * recorded but which was never formally reclaimed (say a `blocked` quest halted before orphan
 * recovery reached it) fresh-spawned instead, and the new child's init line overwrote the old
 * `sessionId` — silently orphaning a session that still held real work.
 *
 * THE ONE EXCEPTION is a work item carrying `agentId`. `agentId` and `sessionId` are stamped
 * together, and only by the MCP `get-agent-prompt` path, where `sessionId` is the PARENT
 * `/dumpster-launch` loop session — not the agent's own. Resuming that would hand a headless child
 * the user's interactive session. Node dispatch stamps `sessionId` alone (`agentId` stays unset for
 * top-level sessions), so `agentId === undefined` is exactly "this session is mine to resume".
 *
 * `taskPrompt` stays the FRESH variant either way: the MCP/Task dispatcher cannot resume and always
 * re-dispatches from it.
 *
 * USAGE:
 * const instruction = buildSpawnInstructionLayerBroker({ questId, workItem });
 * // Returns: SpawnInstruction — ready to embed in a NextStep spawn-agents response
 */

import type { QuestId, WorkItem } from '@dungeonmaster/shared/contracts';

import {
  agentRoleContract,
  type AgentRole,
} from '../../../contracts/agent-role/agent-role-contract';
import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { agentTaskPromptTransformer } from '../../../transformers/agent-task-prompt/agent-task-prompt-transformer';

export const buildSpawnInstructionLayerBroker = ({
  questId,
  workItem,
}: {
  questId: QuestId;
  workItem: WorkItem;
}): SpawnInstruction => {
  const role: AgentRole = agentRoleContract.parse(workItem.role);
  const canResume = workItem.sessionId !== undefined && workItem.agentId === undefined;
  return {
    questId,
    role,
    workItemId: workItem.id,
    taskPrompt: agentTaskPromptTransformer({
      role,
      workItemId: workItem.id,
      questId,
    }),
    ...(canResume
      ? {
          resumeSessionId: workItem.sessionId,
          resumePrompt: agentTaskPromptTransformer({
            role,
            workItemId: workItem.id,
            questId,
            resume: true,
          }),
        }
      : {}),
  };
};
