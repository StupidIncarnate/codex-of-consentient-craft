/**
 * PURPOSE: Layer helper for questGetNextStepBroker — converts a single WorkItem + the quest holding
 * it into a fully-formed SpawnInstruction, resolving the role the session is dispatched as, the
 * Claude CLI model it runs on, and interpolating the taskPrompt template.
 *
 * CLAUDE IS SPAWNED AS THE SCOPE'S ROLE, AND READS THE STEP'S PROMPT. The two are distinct: what
 * Claude is spawned as is `workItem.role` (e.g. `codeweaver`), but the prompt it is instructed to
 * fetch in `taskPrompt` is always the step's own prompt name (e.g. `codeweaver-planner`,
 * `codeweaver-worker`). For a repair step inside a command scope (such as `ward`), the role falls
 * back to the step prompt (`spiritmender`) because command scopes have no agent role.
 *
 * THE MODEL RIDES THE STEP, NOT THE ROLE. `stepDispatchRoleTransformer` reads the work item's own
 * step node off `agentFlowStatics` and hands back its declared `model` (e.g. `codeweaver.work` is
 * `sonnet`, `codeweaver.plan` is `opus`) — the SAME node this broker already reads for `taskPrompt`.
 * A work item running no step graph at all — a role-keyed spiritmender or warpgate dispatch, or a
 * hydrated/legacy quest with no step recorded — has no node to read, so `model` falls back to
 * `roleToModelTransformer({ role })`, the resolved AgentRole above. This is the ONE place a
 * `SpawnInstruction.model` is set: `spawnOneAgentLayerBroker` (Node dispatch) passes it straight to
 * the CLI `--model` flag, and the `/dumpster-launch` slash command (MCP/Task dispatch) is instructed
 * to pass the same `agent.model` to each Task() call — so both dispatchers run a step on the model
 * `agentFlowStatics` declares for it, uniformly.
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
 * const instruction = buildSpawnInstructionLayerBroker({ quest, workItem });
 * // Returns: SpawnInstruction — ready to embed in a NextStep spawn-agents response
 */

import type { Quest, WorkItem } from '@dungeonmaster/shared/contracts';

import { agentPromptNameContract } from '../../../contracts/agent-prompt-name/agent-prompt-name-contract';
import {
  agentRoleContract,
  type AgentRole,
} from '../../../contracts/agent-role/agent-role-contract';
import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { agentTaskPromptTransformer } from '../../../transformers/agent-task-prompt/agent-task-prompt-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { stepDispatchRoleTransformer } from '../../../transformers/step-dispatch-role/step-dispatch-role-transformer';

export const buildSpawnInstructionLayerBroker = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): SpawnInstruction => {
  const questId = quest.id;
  const { prompt: stepPrompt, model: stepModel } = stepDispatchRoleTransformer({ quest, workItem });
  const promptToFetch = stepPrompt ?? agentPromptNameContract.parse(workItem.role);

  const role: AgentRole = agentRoleContract.safeParse(workItem.role).success
    ? agentRoleContract.parse(workItem.role)
    : agentRoleContract.parse(promptToFetch);

  const model = stepModel ?? roleToModelTransformer({ role });

  const canResume = workItem.sessionId !== undefined && workItem.agentId === undefined;
  const override = workItem.smoketestPromptOverride;
  return {
    questId,
    role,
    workItemId: workItem.id,
    model,
    taskPrompt:
      override ??
      agentTaskPromptTransformer({
        agent: promptToFetch,
        workItemId: workItem.id,
        questId,
      }),
    ...(canResume
      ? {
          resumeSessionId: workItem.sessionId,
          resumePrompt:
            override ??
            agentTaskPromptTransformer({
              agent: promptToFetch,
              workItemId: workItem.id,
              questId,
              resume: true,
            }),
        }
      : {}),
  };
};
