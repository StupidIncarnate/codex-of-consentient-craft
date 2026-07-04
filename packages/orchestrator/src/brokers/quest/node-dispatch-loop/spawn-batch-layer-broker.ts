/**
 * PURPOSE: Dispatches one spawn-agents batch by spawning headless Claude CLI children — one per
 * SpawnInstruction, all in parallel. Pre-stamps each work item `in_progress` BEFORE spawning (the
 * MCP-side identity stamp is skipped for top-level sessions, and the stamp is what keeps a
 * concurrently-polling /dumpster-launch from double-dispatching the item), stamps `sessionId` from
 * the child's stream-json init line (which activates the quest-driven watcher tail for live chat),
 * and awaits every child's exit. Terminal work-item status is owned by the child's own signal-back
 * MCP call; a child that dies silently is reclaimed by orphan recovery on a later scan.
 *
 * USAGE:
 * await spawnBatchLayerBroker({ agents: step.agents, registerProcess });
 * // Resolves once every spawned child has exited
 */

import type {
  AdapterResult,
  ExitCode,
  GuildId,
  ModifyQuestInput,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  RepoRootCwd,
} from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  filePathContract,
  processIdContract,
  repoRootCwdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';

import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const spawnBatchLayerBroker = async ({
  agents,
  registerProcess,
}: {
  agents: readonly SpawnInstruction[];
  registerProcess?: (params: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId: QuestWorkItemId;
    kill: () => void;
  }) => void;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });

  // Resolve guild cwd once per quest, not once per instruction.
  const uniqueQuestIds = [...new Set(agents.map((instruction) => instruction.questId))];
  const contextByQuestId = new Map<QuestId, { guildId: GuildId; cwd: RepoRootCwd }>();
  await Promise.all(
    uniqueQuestIds.map(async (questId) => {
      const { guildId } = await questFindQuestPathBroker({ questId });
      const guild = await guildGetBroker({ guildId });
      const startPath = filePathContract.parse(guild.path);
      const cwd = await (async (): Promise<RepoRootCwd> => {
        try {
          return await cwdResolveBroker({ startPath, kind: 'repo-root' });
        } catch {
          return repoRootCwdContract.parse(guild.path);
        }
      })();
      contextByQuestId.set(questId, { guildId, cwd });
    }),
  );

  await Promise.all(
    agents.map(async (instruction) => {
      try {
        const context = contextByQuestId.get(instruction.questId);
        if (context === undefined) {
          throw new Error(`no guild context resolved for quest ${instruction.questId}`);
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

        const model = instruction.model ?? roleToModelTransformer({ role: instruction.role });
        const processId = processIdContract.parse(
          `${orchestrationDispatchStatics.processIdPrefix}-${crypto.randomUUID()}`,
        );

        const sessionStamps: Promise<void>[] = [];
        const { exitCode } = await new Promise<{ exitCode: ExitCode | null }>((resolve) => {
          const { kill, sessionId$ } = agentSpawnUnifiedBroker({
            prompt: instruction.taskPrompt,
            cwd: context.cwd,
            model,
            onLine: (): void => {
              // Live chat renders from the quest-driven watcher's JSONL tail (keyed on the
              // sessionId stamped below) — feeding stdout into the chat pipeline as well
              // would double-emit every line.
            },
            onStderrLine: ({ line }): void => {
              process.stderr.write(`[dev] ◂  stderr  proc:${processId}  ${line}\n`);
            },
            onComplete: ({ exitCode: code }): void => {
              resolve({ exitCode: code });
            },
          });

          registerProcess?.({
            processId,
            questId: instruction.questId,
            questWorkItemId: instruction.workItemId,
            kill,
          });

          sessionStamps.push(
            sessionId$
              .then(async (sessionId) => {
                if (sessionId === null) {
                  return;
                }
                await questModifyBroker({
                  input: {
                    questId: instruction.questId,
                    workItems: [
                      {
                        id: instruction.workItemId,
                        sessionId: sessionIdContract.parse(sessionId),
                      },
                    ],
                  } as ModifyQuestInput,
                });
              })
              .catch((error: unknown) => {
                process.stderr.write(
                  `[node-dispatch] sessionId stamp failed for work item ${instruction.workItemId}: ${String(error)}\n`,
                );
              }),
          );
        });
        await Promise.all(sessionStamps);

        if (exitCode !== null && exitCode !== 0) {
          process.stderr.write(
            `[node-dispatch] ${instruction.role} child for work item ${instruction.workItemId} exited with code ${String(exitCode)} — terminal status is owned by signal-back / orphan recovery\n`,
          );
        }
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
