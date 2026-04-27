/**
 * PURPOSE: Resumes a paused quest by restoring the status stored in pausedAtStatus and re-launching the orchestration loop
 *
 * USAGE:
 * const result = await OrchestrationResumeResponder({ questId });
 * // Returns { resumed: true, restoredStatus: 'seek_scope' } when the paused quest transitions back to its pre-pause status and the loop is relaunched
 */

import type { QuestId, QuestStatus, SessionId } from '@dungeonmaster/shared/contracts';

import {
  filePathContract,
  getQuestInputContract,
  modifyQuestInputContract,
  processIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import type { SlotIndex } from '../../../contracts/slot-index/slot-index-contract';
import { buildOrchestrationLoopOnAgentEntryTransformer } from '../../../transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer';
import {
  isActiveWorkItemStatusGuard,
  isAnyAgentRunningQuestStatusGuard,
  isCompleteWorkItemStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { rawLineToChatEntriesTransformer } from '../../../transformers/raw-line-to-chat-entries/raw-line-to-chat-entries-transformer';

// Note: this launch body is intentionally aligned with the matching block inside
// RecoverGuildLayerResponder. The extraction target (a shared per-quest recovery responder
// call-able from both this responder and the guild-layer responder) is blocked by the
// architecture's "responders cannot import responders" rule. Keep the two sites in sync.

export const OrchestrationResumeResponder = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<{ resumed: boolean; restoredStatus: QuestStatus }> => {
  const input = getQuestInputContract.parse({ questId });
  const getResult = await questGetBroker({ input });

  if (!getResult.success || !getResult.quest) {
    throw new Error(`Quest not found: ${questId}`);
  }

  const { quest } = getResult;

  if (!isUserPausedQuestStatusGuard({ status: quest.status })) {
    throw new Error(`Quest is not paused: ${quest.status}`);
  }

  const restoredStatus = quest.pausedAtStatus;
  if (restoredStatus === undefined || restoredStatus === null) {
    throw new Error(`Quest has no pausedAtStatus snapshot: ${questId}`);
  }

  const modifyResult = await questModifyBroker({
    input: {
      questId,
      status: restoredStatus,
      pausedAtStatus: null,
    } as ModifyQuestInput,
  });

  if (!modifyResult.success) {
    throw new Error(`Failed to resume quest ${questId}: ${modifyResult.error ?? 'unknown error'}`);
  }

  // Re-fetch the quest post-modify so the recovery dispatch operates on the restored state.
  const reloadedResult = await questGetBroker({ input });
  if (!reloadedResult.success || !reloadedResult.quest) {
    throw new Error(`Quest disappeared after resume: ${questId}`);
  }

  const reloaded = reloadedResult.quest;

  // Short-circuit if a process is already running for this quest.
  const existingProcess = orchestrationProcessesState.findByQuestId({ questId: reloaded.id });
  if (existingProcess) {
    return { resumed: true, restoredStatus };
  }

  // Resolve the guild path so questOrchestrationLoopBroker can run from the correct root.
  const { guildId } = await questFindQuestPathBroker({ questId });
  const guild = await guildGetBroker({ guildId });
  const startPath = filePathContract.parse(guild.path);

  // Reset orphaned active work items back to pending — mirrors RecoverGuildLayerResponder.
  const orphanedItems = reloaded.workItems
    .filter((wi) => isActiveWorkItemStatusGuard({ status: wi.status }))
    .map((wi) => ({ id: wi.id, status: 'pending' as const }));

  if (orphanedItems.length > 0) {
    const resetInput = modifyQuestInputContract.parse({
      questId: reloaded.id,
      workItems: orphanedItems,
    });
    await questModifyBroker({ input: resetInput });
  }

  // Insert a pathseeker work item if the restored status is any-agent-running and missing one.
  const needsPathseeker =
    isAnyAgentRunningQuestStatusGuard({ status: reloaded.status }) &&
    !reloaded.workItems.some((wi) => wi.role === 'pathseeker');

  if (needsPathseeker) {
    const chatItemIds = reloaded.workItems
      .filter(
        (wi) =>
          (wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith') &&
          isCompleteWorkItemStatusGuard({ status: wi.status }),
      )
      .map((wi) => wi.id);

    const pathseekerItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'pathseeker',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: chatItemIds,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    });

    const insertInput = modifyQuestInputContract.parse({
      questId: reloaded.id,
      workItems: [pathseekerItem],
    });
    await questModifyBroker({ input: insertInput });
  }

  const processId = processIdContract.parse(`proc-recovery-${crypto.randomUUID()}`);
  const abortController = new AbortController();

  orchestrationProcessesState.register({
    orchestrationProcess: {
      processId,
      questId: reloaded.id,
      kill: (): void => {
        abortController.abort();
      },
    },
  });

  // Per-slot sessionId memo — see RunOrchestrationLoopLayerResponder for rationale.
  const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

  questOrchestrationLoopBroker({
    processId,
    questId: reloaded.id,
    startPath,
    onAgentEntry: ({ slotIndex, entry, sessionId }): void => {
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
  })
    .then(() => {
      orchestrationProcessesState.remove({ processId });
    })
    .catch(() => {
      orchestrationProcessesState.remove({ processId });
    });

  return { resumed: true, restoredStatus };
};
