/**
 * PURPOSE: Dispatches one spawn-agents batch by spawning headless Claude CLI children — one per
 * SpawnInstruction, all in parallel. Resolves each quest's cwd once via `questCwdResolveBroker`
 * (the quest's own worktree, or the legacy repo root for a quest recorded before worktrees
 * existed), pre-stamps each work item `in_progress` BEFORE spawning (the MCP-side identity stamp
 * is skipped for top-level sessions, and the stamp is what keeps a concurrently-polling
 * /dumpster-launch from double-dispatching the item), then hands each instruction to
 * `spawnOneAgentLayerBroker`, which owns the spawn, the sessionId stamp, and the API-overload
 * retry. Terminal work-item status is owned by the child's own signal-back MCP call; a child that
 * dies silently is reclaimed by orphan recovery on a later scan.
 *
 * USAGE:
 * await spawnBatchLayerBroker({ agents: step.agents, registerProcess });
 * // Resolves once every spawned child has exited for good (including any overload retries)
 */

import type {
  AbsoluteFilePath,
  AdapterResult,
  ModifyQuestInput,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  RepoRootCwd,
} from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';

import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { questCwdResolveBroker } from '../cwd-resolve/quest-cwd-resolve-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { spawnOneAgentLayerBroker } from './spawn-one-agent-layer-broker';

export const spawnBatchLayerBroker = async ({
  agents,
  registerProcess,
  unregisterProcess,
  isPlaying,
}: {
  agents: readonly SpawnInstruction[];
  registerProcess?: (params: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId: QuestWorkItemId;
    kill: () => void;
  }) => void;
  unregisterProcess?: (params: { processId: ProcessId }) => void;
  // Forwarded to the per-agent layer so an API-overload backoff — which can sleep for minutes —
  // abandons its retry when the user pauses dispatch instead of waking up and spawning anyway.
  isPlaying?: () => boolean;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });

  // Resolve each quest's cwd once, not once per instruction. A quest resolves to either a usable
  // cwd (its own worktree, or the legacy repo-root fallback) or a recorded-but-missing worktree
  // path — the latter carries no usable cwd, so the per-instruction guard below refuses to spawn.
  const uniqueQuestIds = [...new Set(agents.map((instruction) => instruction.questId))];
  const contextByQuestId = new Map<
    QuestId,
    { cwd: RepoRootCwd } | { worktreePath: AbsoluteFilePath }
  >();
  await Promise.all(
    uniqueQuestIds.map(async (questId) => {
      const resolution = await questCwdResolveBroker({ questId });
      if (resolution.kind === 'missing-worktree') {
        contextByQuestId.set(questId, { worktreePath: resolution.worktreePath });
        return;
      }
      contextByQuestId.set(questId, { cwd: resolution.cwd });
    }),
  );

  await Promise.all(
    agents.map(async (instruction) => {
      try {
        const context = contextByQuestId.get(instruction.questId);
        if (context === undefined) {
          throw new Error(`no cwd resolved for quest ${instruction.questId}`);
        }
        if ('worktreePath' in context) {
          throw new Error(
            `worktree not found for quest ${instruction.questId}: ${context.worktreePath}`,
          );
        }

        // Pre-stamp BEFORE spawning: marks the item taken (so a concurrent get-next-step scan
        // cannot return it again) and records startedAt. In /dumpster-launch mode this stamp
        // comes from get-agent-prompt's identity resolution, which misses for top-level sessions.
        await questModifyBroker({
          input: {
            questId: instruction.questId,
            workItems: [
              {
                id: instruction.workItemId,
                status: 'in_progress',
                startedAt: new Date().toISOString(),
              },
            ],
          } as ModifyQuestInput,
        });

        await spawnOneAgentLayerBroker({
          instruction,
          cwd: context.cwd,
          ...(registerProcess === undefined ? {} : { registerProcess }),
          ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
          ...(isPlaying === undefined ? {} : { isPlaying }),
        });
      } catch (error: unknown) {
        // One failed spawn must not abort the rest of the batch; the un-dispatched item is
        // reclaimed by orphan recovery on a later scan.
        process.stderr.write(
          `[node-dispatch] spawn failed for work item ${instruction.workItemId}: ${String(error)}\n`,
        );
      }
    }),
  );

  return ok;
};
