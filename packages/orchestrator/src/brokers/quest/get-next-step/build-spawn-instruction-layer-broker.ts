/**
 * PURPOSE: Layer helper for questGetNextStepBroker — converts a single WorkItem + the quest holding
 * it into a fully-formed SpawnInstruction, resolving the role the session is dispatched as and
 * interpolating the taskPrompt template.
 *
 * THE STEP NAMES THE ROLE, AND THE WORK ITEM'S OWN ROLE IS THE FALLBACK. A work item carries the
 * role of its SCOPE, so a `repair` step inside a `ward` scope reads `role: 'ward'` — which
 * `agentRoleContract` refuses, and the throw takes the whole dispatch scan down rather than one
 * item. `stepDispatchRoleTransformer` reads the step's own `prompt` first, which for that item is
 * `spiritmender`: a real role with a real registered prompt.
 *
 * THE FALLBACK IS TEMPORARY AND ENDS ON ITS OWN. Several prompts the step graph names are not
 * registered — `codeweaver-planner`, `codeweaver-worker`, `recipe-maker`, `flowrider-planner`,
 * `flowrider-worker`, `siegemaster-reader`, `siege-planner`, both siege walkers and both siege
 * fixers — so a step naming one is dispatched on its work item's own role; re-keying
 * unconditionally would throw on every codeweaver, flowrider and siegemaster dispatch instead.
 * Register those prompts as roles `agentRoleContract` enumerates and the step-keyed branch takes
 * them, with nothing here to edit. A DECLINED STEP PROMPT IS WRITTEN TO STDERR on the dispatch it
 * happened on — the mechanism this package already uses for a decision that must not pass unseen
 * (`questListBroker`'s skip line, `agentPromptGetBroker`'s start-ref line).
 * `processDevLogAdapter` is the wrong instrument twice over: it belongs to the server package, and
 * it is gated behind `VERBOSE=1`, which is silent by default.
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

import {
  agentRoleContract,
  type AgentRole,
} from '../../../contracts/agent-role/agent-role-contract';
import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { agentTaskPromptTransformer } from '../../../transformers/agent-task-prompt/agent-task-prompt-transformer';
import { stepDispatchRoleTransformer } from '../../../transformers/step-dispatch-role/step-dispatch-role-transformer';

export const buildSpawnInstructionLayerBroker = ({
  quest,
  workItem,
}: {
  quest: Quest;
  workItem: WorkItem;
}): SpawnInstruction => {
  const questId = quest.id;
  const { role: steppedRole, declinedPrompt } = stepDispatchRoleTransformer({ quest, workItem });

  if (declinedPrompt !== null) {
    process.stderr.write(
      `[dispatch-role] work item ${String(workItem.id)} on quest ${String(questId)} runs step \`${String(workItem.step)}\`, whose prompt \`${String(declinedPrompt)}\` is not a dispatchable agent role — dispatching as \`${workItem.role}\` instead\n`,
    );
  }

  const role: AgentRole = steppedRole ?? agentRoleContract.parse(workItem.role);
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
