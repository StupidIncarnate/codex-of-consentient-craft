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
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { buildOrchestrationLoopOnAgentEntryTransformer } from '../../../transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer';
import { rawLineToChatEntriesTransformer } from '../../../transformers/raw-line-to-chat-entries/raw-line-to-chat-entries-transformer';

export const RunOrchestrationLoopLayerResponder = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });

  const existing = orchestrationProcessesState.findByQuestId({ questId });
  // OrchestrationStartResponder pre-registers a placeholder process (prefix `proc-`)
  // when an HTTP /start call returns a processId before the queue runner picks the
  // quest up. We adopt that processId so callers polling /api/process/:processId
  // continue to find the same handle once the loop is live. Other prefixes
  // (`proc-queue-`, `chat-`, `proc-recovery-`) indicate a real loop is already
  // running — skip in that case.
  const adoptedProcessId = ((): ProcessId | null => {
    if (existing === undefined) {
      return null;
    }
    const { processId: existingId } = existing;
    if (
      existingId.startsWith('proc-') &&
      !existingId.startsWith('proc-queue-') &&
      !existingId.startsWith('proc-recovery-')
    ) {
      return existingId;
    }
    return null;
  })();
  if (existing !== undefined && adoptedProcessId === null) {
    // Another responder (e.g. a chat pathway) already spawned a loop for this quest.
    // The queue runner should not start a second one — await nothing.
    return ok;
  }
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
      onAgentEntry: ({ slotIndex, entry, sessionId }) => {
        const rawLine: unknown = entry.raw;
        if (typeof rawLine !== 'string') return;
        const parsed = claudeLineNormalizeBroker({ rawLine });
        const entries = rawLineToChatEntriesTransformer({ parsed, rawLine });
        if (entries.length === 0) return;
        const payload = buildOrchestrationLoopOnAgentEntryTransformer({
          processId,
          slotIndexToSessionId,
          slotIndex,
          entries,
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
