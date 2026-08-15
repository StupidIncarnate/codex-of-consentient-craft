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
 * A `smoketestPromptOverride` on the work item REPLACES BOTH prompts, and `taskPrompt` is the one
 * that matters most: a smoketest work item is freshly minted and carries no `sessionId`, so the
 * fresh branch is the branch every scripted agent is actually dispatched down. This is the only
 * point where that canned script can reach the child — both dispatchers, the MCP/Task loop and the
 * Node headless spawner, read their prompt from the SpawnInstruction, and a scripted agent never
 * calls `get-agent-prompt`, so nothing downstream could substitute it. Overriding `resumePrompt`
 * alone leaves the whole suite dispatching REAL role sessions against the working tree: the
 * scripted child gets the interpolated codeweaver brief, reads the repo and starts editing it, and
 * the run reports on work nobody asked for. It wins on the resume path too, because the resume
 * variant opens by telling the agent it was cut off and must re-establish state, which would derail
 * a one-signal script into arbitrary work.
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
  const override = workItem.smoketestPromptOverride;
  return {
    questId,
    role,
    workItemId: workItem.id,
    taskPrompt:
      override ??
      agentTaskPromptTransformer({
        role,
        workItemId: workItem.id,
        questId,
      }),
    ...(canResume
      ? {
          resumeSessionId: workItem.sessionId,
          resumePrompt:
            override ??
            agentTaskPromptTransformer({
              role,
              workItemId: workItem.id,
              questId,
              resume: true,
            }),
        }
      : {}),
  };
};
