/**
 * PURPOSE: Layer helper for questNodeDispatchLoopBroker — spawns ONE headless Claude CLI child for
 *   one SpawnInstruction, stamps `sessionId` from its init line, and awaits its exit. Owns the
 *   API-OVERLOAD RETRY: a child that dies with a non-zero exit code after emitting a 529 /
 *   `overloaded_error` marker did not fail, the upstream API did, so the same work item is
 *   re-dispatched on `apiOverloadRetryStatics`' schedule (tight, then patient) instead of being
 *   handed to orphan recovery. Recovery's budget is only 3 resets — without this, a few minutes of
 *   Anthropic 529s spends it and blocks the quest.
 *
 *   RESUME ACROSS RETRIES: once any attempt captured a sessionId, every later attempt resumes THAT
 *   session (`claude --resume` + the finish-what-you-started prompt), so an agent that worked for
 *   twenty minutes and then hit the outage keeps its context. An attempt that died before its init
 *   line has no session to resume and re-spawns fresh.
 *
 *   Terminal work-item status is never written here — it belongs to the child's own signal-back.
 *
 * USAGE:
 * await spawnOneAgentLayerBroker({ instruction, cwd });
 * // Resolves once the child exited for good — i.e. it exited cleanly, it died for a reason other
 * //   than an API overload, the retry schedule was spent, or dispatch was paused mid-wait.
 */

import type {
  AdapterResult,
  ExitCode,
  ProcessId,
  QuestId,
  QuestWorkItemId,
  RepoRootCwd,
  SessionId,
} from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  getQuestInputContract,
  modifyQuestInputContract,
  processIdContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import { timerSetTimeoutAdapter } from '../../../adapters/timer/set-timeout/timer-set-timeout-adapter';
import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { isApiOverloadLineGuard } from '../../../guards/is-api-overload-line/is-api-overload-line-guard';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { agentTaskPromptTransformer } from '../../../transformers/agent-task-prompt/agent-task-prompt-transformer';
import { apiOverloadRetryDelayTransformer } from '../../../transformers/api-overload-retry-delay/api-overload-retry-delay-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const spawnOneAgentLayerBroker = async ({
  instruction,
  cwd,
  registerProcess,
  unregisterProcess,
  isPlaying,
  overloadAttempt = 0,
  carriedSessionId,
}: {
  instruction: SpawnInstruction;
  cwd: RepoRootCwd;
  registerProcess?: (params: {
    processId: ProcessId;
    questId: QuestId;
    questWorkItemId: QuestWorkItemId;
    kill: () => void;
  }) => void;
  // Called once each attempt's child has exited. Without it every attempt leaves a registry entry
  // behind whose child is long dead, which the stale-process watchdog then warns about forever —
  // and an overload retry would mint up to 30 of them for a single work item.
  unregisterProcess?: (params: { processId: ProcessId }) => void;
  isPlaying?: () => boolean;
  // Recursion state: how many overload retries have already been spent, and the sessionId a prior
  // attempt captured (so this attempt resumes it rather than starting over).
  overloadAttempt?: number;
  carriedSessionId?: SessionId;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });

  const model = instruction.model ?? roleToModelTransformer({ role: instruction.role });
  const processId = processIdContract.parse(
    `${orchestrationDispatchStatics.processIdPrefix}-${crypto.randomUUID()}`,
  );

  // Resume path: either orphan recovery retained a crashed session (resumePrompt on the
  // instruction) or an earlier attempt in THIS dispatch captured one before the overload killed
  // it. Both resume the retained Claude session with the finish-what-you-started prompt. The
  // MCP/Task dispatcher never reaches this broker — it re-dispatches fresh by construction.
  const instructionResumeSessionId =
    instruction.resumePrompt === undefined ? undefined : instruction.resumeSessionId;
  const resumeSessionId = carriedSessionId ?? instructionResumeSessionId;
  const resumePrompt =
    resumeSessionId === undefined
      ? undefined
      : (instruction.resumePrompt ??
        agentTaskPromptTransformer({
          role: instruction.role,
          workItemId: instruction.workItemId,
          questId: instruction.questId,
          resume: true,
        }));

  const overload = { seen: false };
  const sessionStamps: Promise<void>[] = [];
  const capturedSession: { id: SessionId | undefined } = { id: undefined };

  const { exitCode } = await new Promise<{ exitCode: ExitCode | null }>((resolve) => {
    const { kill, sessionId$ } = agentSpawnUnifiedBroker({
      prompt: resumePrompt ?? instruction.taskPrompt,
      ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
      cwd,
      model,
      onLine: ({ line }): void => {
        // Live chat renders from the quest-driven watcher's JSONL tail (keyed on the sessionId
        // stamped below) — feeding stdout into the chat pipeline as well would double-emit every
        // line. The only thing read off stdout here is the API-overload marker.
        if (isApiOverloadLineGuard({ line })) {
          overload.seen = true;
        }
      },
      onStderrLine: ({ line }): void => {
        if (isApiOverloadLineGuard({ line })) {
          overload.seen = true;
        }
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
          const parsed = sessionIdContract.parse(sessionId);
          capturedSession.id = parsed;
          await questModifyBroker({
            input: modifyQuestInputContract.parse({
              questId: instruction.questId,
              workItems: [{ id: instruction.workItemId, sessionId: parsed }],
            }),
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
  // This attempt's child is gone; drop its registry entry so the stale watchdog stops reporting it.
  unregisterProcess?.({ processId });

  if (exitCode === null || exitCode === 0) {
    return ok;
  }

  if (!overload.seen) {
    process.stderr.write(
      `[node-dispatch] ${instruction.role} child for work item ${instruction.workItemId} exited with code ${String(exitCode)} — terminal status is owned by signal-back / orphan recovery\n`,
    );
    return ok;
  }

  const nextAttempt = overloadAttempt + 1;
  const delayMs = apiOverloadRetryDelayTransformer({ attempt: nextAttempt });
  if (delayMs === null) {
    process.stderr.write(
      `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} still hitting API overload after ${String(overloadAttempt)} retries — schedule spent, handing off to orphan recovery\n`,
    );
    return ok;
  }

  if (isPlaying !== undefined && !isPlaying()) {
    process.stderr.write(
      `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} hit API overload but dispatch is paused — abandoning retry\n`,
    );
    return ok;
  }

  process.stderr.write(
    `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} died on API overload — retry ${String(nextAttempt)} in ${String(delayMs)}ms\n`,
  );
  await timerSetTimeoutAdapter({ ms: delayMs });

  // The wait is long enough that the world can change under it: the user can pause dispatch, and
  // the dying child may have signalled back before it lost the API. Re-check both before respawning.
  if (isPlaying !== undefined && !isPlaying()) {
    process.stderr.write(
      `[node-dispatch] dispatch paused during API-overload backoff — abandoning retry for work item ${instruction.workItemId}\n`,
    );
    return ok;
  }

  const refreshed = await questGetBroker({
    input: getQuestInputContract.parse({ questId: instruction.questId }),
  });
  const refreshedItem = refreshed.quest?.workItems.find(
    (workItem) => workItem.id === instruction.workItemId,
  );
  if (
    refreshedItem !== undefined &&
    isTerminalWorkItemStatusGuard({ status: refreshedItem.status })
  ) {
    process.stderr.write(
      `[node-dispatch] work item ${instruction.workItemId} went terminal during API-overload backoff — no retry needed\n`,
    );
    return ok;
  }

  const nextCarriedSessionId = capturedSession.id ?? resumeSessionId;

  return spawnOneAgentLayerBroker({
    instruction,
    cwd,
    ...(registerProcess === undefined ? {} : { registerProcess }),
    ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
    ...(isPlaying === undefined ? {} : { isPlaying }),
    overloadAttempt: nextAttempt,
    ...(nextCarriedSessionId === undefined ? {} : { carriedSessionId: nextCarriedSessionId }),
  });
};
