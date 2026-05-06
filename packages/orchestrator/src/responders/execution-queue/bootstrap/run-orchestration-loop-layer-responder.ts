/**
 * PURPOSE: Layer helper for ExecutionQueueBootstrapResponder — wraps questOrchestrationLoopBroker with per-quest process registration, abort-signal wiring, and chat-entry relay so the queue runner can invoke it with just `{ questId, guildId }`.
 *
 * USAGE:
 * const result = await RunOrchestrationLoopLayerResponder({ questId, guildId });
 * // Resolves when the orchestration loop exits (loop yields on paused / terminal / drain).
 *
 * WHEN-TO-USE: Wired into the execution-queue-runner's runOrchestrationLoop dep at bootstrap.
 * WHEN-NOT-TO-USE: Outside the queue bootstrap — responders that already have a processId should call
 * questOrchestrationLoopBroker directly.
 */

import type { AdapterResult, SessionId } from '@dungeonmaster/shared/contracts';
import {
  adapterResultContract,
  filePathContract,
  processIdContract,
} from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { buildOrchestrationLoopOnAgentEntryTransformer } from '../../../transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer';

export const RunOrchestrationLoopLayerResponder = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });

  // Enumerate every process registered for this quest. `chat-*` / `design-*` post-exit
  // JSONL tails (registered by `chat-start-responder`'s `onComplete`) share the quest's
  // real `questId` to keep the tail killable on quest teardown — they are NOT loop
  // processes and must not block a fresh loop start. Only `proc-queue-*` /
  // `proc-recovery-*` represent an actual orchestration loop in flight; using the old
  // `findByQuestId` returned the chat tail (insertion order) and silently skipped the
  // dispatch when the user clicked Begin Quest right after the spec chat ended.
  const allForQuest = orchestrationProcessesState.findAllByQuestId({ questId });
  const loopAlreadyRunning = allForQuest.some(
    (p) => p.processId.startsWith('proc-queue-') || p.processId.startsWith('proc-recovery-'),
  );
  if (loopAlreadyRunning) {
    return ok;
  }
  // OrchestrationStartResponder pre-registers a placeholder process (prefix `proc-`,
  // not `proc-queue-` / `proc-recovery-`) when an HTTP /start call returns a processId
  // before the queue runner picks the quest up. Adopt it so callers polling
  // /api/process/:processId continue to find the same handle once the loop is live.
  const placeholder = allForQuest.find(
    (p) =>
      p.processId.startsWith('proc-') &&
      !p.processId.startsWith('proc-queue-') &&
      !p.processId.startsWith('proc-recovery-'),
  );
  const adoptedProcessId: ProcessId | null = placeholder?.processId ?? null;
  const processId =
    adoptedProcessId ?? processIdContract.parse(`proc-queue-${crypto.randomUUID()}`);
  const abortController = new AbortController();

  orchestrationProcessesState.register({
    orchestrationProcess: {
      processId,
      questId,
      kill: (): void => {
        abortController.abort();
      },
    },
  });

  const guild = await guildGetBroker({ guildId });
  const startPath = filePathContract.parse(guild.path);

  // Per-slot sessionId memo. The slot manager learns each agent's sessionId asynchronously
  // (after Claude CLI emits its system/init line). The first chat-output emits arrive BEFORE
  // sessionId is known, so payload.sessionId is undefined for those. Once the slot manager
  // resolves a sessionId for a slot, it is forwarded on every subsequent onAgentEntry call —
  // we mirror that into this map so chat-output broadcasts always carry sessionId once known,
  // even if the upstream lookup ever returns undefined for a transient race. We also stamp
  // chatProcessId = sessionId so the web client's existing replay-style routing (keyed on
  // chatProcessId) finds the right work-item bucket when sessionId is present.
  const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

  try {
    await questOrchestrationLoopBroker({
      processId,
      questId,
      startPath,
      guildId,
      onAgentEntry: ({ slotIndex, entries, questWorkItemId, sessionId }) => {
        const payload = buildOrchestrationLoopOnAgentEntryTransformer({
          processId,
          slotIndexToSessionId,
          slotIndex,
          entries,
          questId,
          workItemId: questWorkItemId,
          ...(sessionId === undefined ? {} : { sessionId }),
        });
        orchestrationEventsState.emit({ type: 'chat-output', processId, payload });
      },
      abortSignal: abortController.signal,
    });
  } finally {
    orchestrationProcessesState.remove({ processId });
  }

  return ok;
};
