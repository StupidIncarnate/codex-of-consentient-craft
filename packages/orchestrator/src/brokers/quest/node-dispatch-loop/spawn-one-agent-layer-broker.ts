/**
 * PURPOSE: Layer helper for questNodeDispatchLoopBroker — spawns ONE headless Claude CLI child for
 *   one SpawnInstruction, stamps `sessionId` from its init line, and awaits its exit. Owns the
 *   API-OVERLOAD RETRY: a child that dies with a non-zero exit code after emitting a 529 /
 *   `overloaded_error` marker did not fail, the upstream API did, so the same work item is
 *   re-dispatched on `apiOverloadRetryStatics`' schedule (tight, then patient) instead of being
 *   handed to orphan recovery. Recovery's budget is only 3 resets — without this, a few minutes of
 *   Anthropic 529s spends it and blocks the quest.
 *
 *   IT ALSO OWNS THE OPPOSITE CASE. A child that dies after a 429 lost the account's own quota, and
 *   that one must NOT be retried: nothing changes until the window resets, so every respawn earns
 *   another refusal. It records a dispatch-wide hold instead and returns, which stops the queue
 *   rather than this one work item. Without the split a quota refusal reads as a plain crash, and
 *   three of them spend the orphan-recovery budget and block the quest.
 *
 *   RESUME ACROSS RETRIES: once any attempt captured a sessionId, every later attempt resumes THAT
 *   session (`claude --resume` + the finish-what-you-started prompt), so an agent that worked for
 *   twenty minutes and then hit the outage keeps its context. An attempt that died before its init
 *   line has no session to resume and re-spawns fresh.
 *
 *   A SESSION CUT OFF FROM `quest-work` IS WALLED HERE. A child whose init line shows the
 *   dungeonmaster MCP server not `connected` has no tool to report through, so it is killed at once
 *   and its work item recorded `wall`; so is one whose final `result` line names a
 *   `DUNGEONMASTER-WALL:` (agentSessionWallReasonTransformer). A child that exits CLEANLY without
 *   signalling goes to sessionEndLayerBroker, which resumes it once with a prompt that says so
 *   rather than letting orphan recovery tell it it was killed.
 *
 *   Every other terminal work-item status belongs to the child's own signal-back.
 *
 * USAGE:
 * await spawnOneAgentLayerBroker({ instruction, cwd });
 * // Resolves once the child exited for good — i.e. it exited cleanly, it died for a reason other
 * //   than an API overload, the retry schedule was spent, or dispatch was paused mid-wait.
 */

import { stderr } from '#gateway/node/process';
import { randomUUID } from '#gateway/node/crypto';
import type { Quest, WorkItem, Session } from '@dungeonmaster/shared/contracts';
import {
  getQuestInputContract,
  modifyQuestInputContract,
  workItemRoleContract,
  sessionContract,
} from '@dungeonmaster/shared/contracts';
import { isTerminalWorkItemStatusGuard } from '@dungeonmaster/shared/guards';

import type { SpawnInstruction } from '../../../contracts/spawn-instruction/spawn-instruction-contract';
import { isApiOverloadLineGuard } from '../../../guards/is-api-overload-line/is-api-overload-line-guard';
import { isRateLimitRejectedLineGuard } from '../../../guards/is-rate-limit-rejected-line/is-rate-limit-rejected-line-guard';
import { orchestrationDispatchStatics } from '../../../statics/orchestration-dispatch/orchestration-dispatch-statics';
import { agentSessionWallReasonTransformer } from '../../../transformers/agent-session-wall-reason/agent-session-wall-reason-transformer';
import { agentTaskPromptTransformer } from '../../../transformers/agent-task-prompt/agent-task-prompt-transformer';
import { agentUnsignalledExitPromptTransformer } from '../../../transformers/agent-unsignalled-exit-prompt/agent-unsignalled-exit-prompt-transformer';
import { apiOverloadRetryDelayTransformer } from '../../../transformers/api-overload-retry-delay/api-overload-retry-delay-transformer';
import { roleToModelTransformer } from '../../../transformers/role-to-model/role-to-model-transformer';
import { agentSpawnUnifiedBroker } from '../../agent/spawn-unified/agent-spawn-unified-broker';
import { dispatchHoldRejectBroker } from '../../dispatch-hold/reject/dispatch-hold-reject-broker';
import { timerSleepBroker } from '../../timer/sleep/timer-sleep-broker';
import { questGetBroker } from '../get/quest-get-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';
import { questSessionRecordBroker } from '../session-record/quest-session-record-broker';
import { sessionEndLayerBroker } from './session-end-layer-broker';

export const spawnOneAgentLayerBroker = async ({
  instruction,
  cwd,
  registerProcess,
  unregisterProcess,
  isPlaying,
  overloadAttempt = 0,
  carriedSessionId,
  unsignalledNudges = 0,
  promptOverride,
}: {
  instruction: SpawnInstruction;
  cwd: string;
  registerProcess?: (params: {
    processId: string;
    questId: Quest['id'];
    questWorkItemId: WorkItem['id'];
    kill: () => void;
  }) => void;
  // Called once each attempt's child has exited. Without it every attempt leaves a registry entry
  // behind whose child is long dead, which the stale-process watchdog then warns about forever —
  // and an overload retry would mint up to 30 of them for a single work item.
  unregisterProcess?: (params: { processId: string }) => void;
  isPlaying?: () => boolean;
  // Recursion state: how many overload retries have already been spent, and the sessionId a prior
  // attempt captured (so this attempt resumes it rather than starting over).
  overloadAttempt?: number;
  carriedSessionId?: Session['id'];
  // How many unsignalled-exit resumes this work item has already had, and the prompt the next
  // resume sends instead of the finish-what-you-started one. Set only by this broker's own recursion.
  unsignalledNudges?: number;
  promptOverride?: string;
}): Promise<void> => {
  const model = instruction.model ?? roleToModelTransformer({ role: instruction.role });
  const processId = `${orchestrationDispatchStatics.processIdPrefix}-${randomUUID()}`;

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
      : (promptOverride ??
        instruction.resumePrompt ??
        agentTaskPromptTransformer({
          role: instruction.role,
          workItemId: instruction.workItemId,
          questId: instruction.questId,
          resume: true,
        }));

  const overload = { seen: false };
  // Tracked separately from `overload`, because the two upstream deaths need opposite answers: a
  // 529 is waited out by respawning this child, a 429 means every child would die the same way.
  const rejection = { seen: false, line: '' };
  // The reason a session hit a wall it cannot report through `quest-work`. The kill handle is filled
  // in once the spawn returns it; the first wall line kills the child, since it can do nothing more.
  const wall: { reason: string | undefined } = { reason: undefined };
  const child: { kill: () => void } = { kill: () => undefined };
  const sessionStamps: Promise<void>[] = [];
  const capturedSession: { id: Session['id'] | undefined } = { id: undefined };

  const { exitCode } = await new Promise<{ exitCode: number | null }>((resolve) => {
    const { kill, sessionId$ } = agentSpawnUnifiedBroker({
      prompt: resumePrompt ?? instruction.taskPrompt,
      ...(resumeSessionId === undefined ? {} : { resumeSessionId }),
      cwd,
      model,
      onLine: ({ line }): void => {
        // Live chat renders from the quest-driven watcher's JSONL tail (keyed on the sessionId
        // stamped below) — feeding stdout into the chat pipeline as well would double-emit every
        // line. The only things read off stdout here are the two upstream-failure markers.
        if (isApiOverloadLineGuard({ line })) {
          overload.seen = true;
        }
        if (isRateLimitRejectedLineGuard({ line })) {
          rejection.seen = true;
          rejection.line = line;
        }
        const wallReason = agentSessionWallReasonTransformer({ line });
        if (wallReason !== undefined && wall.reason === undefined) {
          wall.reason = wallReason;
          child.kill();
        }
      },
      onStderrLine: ({ line }): void => {
        if (isApiOverloadLineGuard({ line })) {
          overload.seen = true;
        }
        if (isRateLimitRejectedLineGuard({ line })) {
          rejection.seen = true;
          rejection.line = line;
        }
        stderr.write(`[dev] ◂  stderr  proc:${processId}  ${line}\n`);
      },
      onComplete: ({ exitCode: code }): void => {
        resolve({ exitCode: code });
      },
    });

    child.kill = kill;

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
          const parsed = sessionContract.shape.id.parse(sessionId);
          capturedSession.id = parsed;
          await questModifyBroker({
            input: modifyQuestInputContract.parse({
              questId: instruction.questId,
              workItems: [{ id: instruction.workItemId, sessionId: parsed }],
            }),
          });
          // `cwd` is this child's ACTUAL working directory — the same value handed to
          // agentSpawnUnifiedBroker above — so the row records where the transcript really is
          // rather than where the quest currently points. An overload retry recurses with the same
          // cwd and the append is idempotent on sessionId, so a resumed attempt re-records nothing.
          // Its OWN catch, not the outer one: a bookkeeping row that fails to land must not report
          // itself as a failed sessionId stamp, which is the line an operator would act on.
          await questSessionRecordBroker({
            questId: instruction.questId,
            sessionId: parsed,
            cwd,
            role: workItemRoleContract.parse(instruction.role),
            workItemId: instruction.workItemId,
          }).catch((error: unknown) => {
            stderr.write(
              `[node-dispatch] session cwd record failed for work item ${instruction.workItemId}: ${String(error)}\n`,
            );
          });
        })
        .catch((error: unknown) => {
          stderr.write(
            `[node-dispatch] sessionId stamp failed for work item ${instruction.workItemId}: ${String(error)}\n`,
          );
        }),
    );
  });

  await Promise.all(sessionStamps);
  // This attempt's child is gone; drop its registry entry so the stale watchdog stops reporting it.
  // Written as a guarded call rather than `unregisterProcess?.(...)`: an optional-chained call on a
  // void-returning callback types as `void | undefined`, which enforce-folder-return-types cannot
  // tell apart from a real informative discard — the guard keeps the call genuinely void.
  if (unregisterProcess) {
    unregisterProcess({ processId });
  }

  // A walled child was killed by this broker, so its exit code says nothing about the session; the
  // wall is checked before the exit code for that reason.
  if (wall.reason !== undefined || exitCode === null || exitCode === 0) {
    const sessionToNudge = capturedSession.id ?? resumeSessionId;
    const shouldNudge = await sessionEndLayerBroker({
      instruction,
      sessionId: sessionToNudge,
      nudgesSpent: unsignalledNudges,
      ...(wall.reason === undefined ? {} : { wallReason: wall.reason }),
    });

    if (!shouldNudge || sessionToNudge === undefined) {
      return;
    }

    return spawnOneAgentLayerBroker({
      instruction,
      cwd,
      ...(registerProcess === undefined ? {} : { registerProcess }),
      ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
      ...(isPlaying === undefined ? {} : { isPlaying }),
      carriedSessionId: sessionToNudge,
      unsignalledNudges: unsignalledNudges + 1,
      promptOverride: agentUnsignalledExitPromptTransformer({
        agent: instruction.role,
        workItemId: instruction.workItemId,
        questId: instruction.questId,
      }),
    });
  }

  // Checked BEFORE the overload branch, and it never retries. A quota refusal is the one upstream
  // death where respawning is guaranteed to fail: nothing changes until the window resets, so the
  // retry schedule would spend up to 30 attempts producing 30 more refusals. Recording the hold
  // stops the whole queue instead, which is the only response that helps, and the poller lifts it
  // when the wait is up.
  if (rejection.seen) {
    const hold = await dispatchHoldRejectBroker({ line: rejection.line, nowMs: Date.now() }).catch(
      (error: unknown) => {
        stderr.write(
          `[node-dispatch] failed to record the rate-limit hold for work item ${instruction.workItemId}: ${String(error)}\n`,
        );
        return null;
      },
    );
    stderr.write(
      `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} died on a rate-limit refusal — dispatch holds until ${hold === null ? 'the next poll re-reads the state' : hold.resumeAt}\n`,
    );
    return;
  }

  if (!overload.seen) {
    stderr.write(
      `[node-dispatch] ${instruction.role} child for work item ${instruction.workItemId} exited with code ${String(exitCode)} — terminal status is owned by signal-back / orphan recovery\n`,
    );
    return;
  }

  const nextAttempt = overloadAttempt + 1;
  const delayMs = apiOverloadRetryDelayTransformer({ attempt: nextAttempt });
  if (delayMs === null) {
    stderr.write(
      `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} still hitting API overload after ${String(overloadAttempt)} retries — schedule spent, handing off to orphan recovery\n`,
    );
    return;
  }

  if (isPlaying !== undefined && !isPlaying()) {
    stderr.write(
      `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} hit API overload but dispatch is paused — abandoning retry\n`,
    );
    return;
  }

  stderr.write(
    `[node-dispatch] ${instruction.role} work item ${instruction.workItemId} died on API overload — retry ${String(nextAttempt)} in ${String(delayMs)}ms\n`,
  );
  await timerSleepBroker({ ms: delayMs });

  // The wait is long enough that the world can change under it: the user can pause dispatch, and
  // the dying child may have signalled back before it lost the API. Re-check both before respawning.
  if (isPlaying !== undefined && !isPlaying()) {
    stderr.write(
      `[node-dispatch] dispatch paused during API-overload backoff — abandoning retry for work item ${instruction.workItemId}\n`,
    );
    return;
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
    stderr.write(
      `[node-dispatch] work item ${instruction.workItemId} went terminal during API-overload backoff — no retry needed\n`,
    );
    return;
  }

  const nextCarriedSessionId = capturedSession.id ?? resumeSessionId;

  return spawnOneAgentLayerBroker({
    instruction,
    cwd,
    ...(registerProcess === undefined ? {} : { registerProcess }),
    ...(unregisterProcess === undefined ? {} : { unregisterProcess }),
    ...(isPlaying === undefined ? {} : { isPlaying }),
    overloadAttempt: nextAttempt,
    unsignalledNudges,
    ...(nextCarriedSessionId === undefined ? {} : { carriedSessionId: nextCarriedSessionId }),
  });
};
