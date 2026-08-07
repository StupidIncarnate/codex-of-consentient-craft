/**
 * PURPOSE: Resumes a halted quest and re-launches the orchestration loop. Two halts reach here:
 *   a user PAUSE, which restores the status snapshotted in `pausedAtStatus`; and a `blocked` quest,
 *   which has no snapshot (the block is not a pause) and restores to `in_progress`.
 *
 *   A blocked quest also needs its work items REARMED, not just its status flipped. It halted with
 *   the blocking item `failed` at the orphan-recovery budget and everything queued behind it
 *   drained to `skipped`; re-entering the scan with that intact makes the very next recovery pass
 *   re-escalate the same exhausted item and block again, so the user's RESUME visibly does
 *   nothing. `questResumeRearmWorkItemsTransformer` puts every item whose operation item is still
 *   unfinished back to `pending` with a cleared `retryCount`, keeping `sessionId` + the `resume`
 *   marker so dispatch resumes those Claude sessions instead of discarding their work.
 *
 * USAGE:
 * const result = await OrchestrationResumeResponder({ questId });
 * // Returns { resumed: true, restoredStatus: 'in_progress' } when the halted quest transitions
 * //   back to its pre-halt status, its work items are rearmed, and the loop is relaunched
 */

import type { QuestId, QuestStatus, SessionId } from '@dungeonmaster/shared/contracts';

import {
  filePathContract,
  getQuestInputContract,
  modifyQuestInputContract,
  processIdContract,
} from '@dungeonmaster/shared/contracts';
import type { ModifyQuestInput } from '@dungeonmaster/shared/contracts';

import type { SlotIndex } from '@dungeonmaster/shared/contracts';
import { buildOrchestrationLoopOnAgentEntryTransformer } from '../../../transformers/build-orchestration-loop-on-agent-entry/build-orchestration-loop-on-agent-entry-transformer';
import { questResumeRearmWorkItemsTransformer } from '../../../transformers/quest-resume-rearm-work-items/quest-resume-rearm-work-items-transformer';
import {
  isActiveWorkItemStatusGuard,
  isQuestBlockedQuestStatusGuard,
  isQuestResumableQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { guildGetBroker } from '../../../brokers/guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questGetBroker } from '../../../brokers/quest/get/quest-get-broker';
import { questModifyBroker } from '../../../brokers/quest/modify/quest-modify-broker';
import { questOrchestrationLoopBroker } from '../../../brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { orchestrationEventsState } from '../../../state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';

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

  if (!isQuestResumableQuestStatusGuard({ status: quest.status })) {
    throw new Error(`Quest is not resumable: ${quest.status}`);
  }

  // A block is not a pause, so it leaves no `pausedAtStatus` snapshot — execution is the only
  // status it can return to. A pause restores whatever it interrupted, spec phases included.
  const isBlocked = isQuestBlockedQuestStatusGuard({ status: quest.status });
  const restoredStatus: QuestStatus | null | undefined = isBlocked
    ? 'in_progress'
    : quest.pausedAtStatus;
  if (restoredStatus === undefined || restoredStatus === null) {
    throw new Error(`Quest has no pausedAtStatus snapshot: ${questId}`);
  }

  // Rearm BEFORE the status flip: the moment the quest reads `in_progress` the dispatch scan can
  // pick it up, and a scan that sees the un-rearmed wreckage re-escalates and blocks it again.
  const rearmedWorkItems = isBlocked
    ? questResumeRearmWorkItemsTransformer({
        workItems: quest.workItems,
        operations: quest.operations,
      })
    : [];
  if (rearmedWorkItems.length > 0) {
    await questModifyBroker({
      input: modifyQuestInputContract.parse({ questId, workItems: rearmedWorkItems }),
    });
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

  const announcementProcessId = processIdContract.parse(`proc-resume-${crypto.randomUUID()}`);
  orchestrationEventsState.emit({
    type: 'quest-resumed',
    processId: announcementProcessId,
    payload: {
      questId,
      restoredStatus,
    },
  });

  // Short-circuit if a process is already running for this quest.
  const existingProcess = orchestrationProcessesState.findByQuestId({ questId: reloaded.id });
  if (existingProcess) {
    return { resumed: true, restoredStatus };
  }

  // Resolve the guild path so questOrchestrationLoopBroker can run from the correct root.
  const { guildId } = await questFindQuestPathBroker({ questId });
  const guild = await guildGetBroker({ guildId });
  const startPath = filePathContract.parse(guild.path);

  // Reset orphaned active work items back to pending, keeping sessionId + the resume marker so
  // Node dispatch resumes the interrupted session (work preserved) instead of fresh-spawning.
  // A missing next work item is NOT repaired here — the dispatch scan's operations-aware
  // advance self-heal creates it from the ledger. On the blocked path the rearm above already
  // covered these (and cleared their retryCount too), so this finds nothing left to reset.
  const orphanedItems = reloaded.workItems
    .filter((wi) => isActiveWorkItemStatusGuard({ status: wi.status }))
    .map((wi) => ({
      id: wi.id,
      status: 'pending' as const,
      ...(wi.sessionId === undefined ? {} : { resume: true }),
    }));

  if (orphanedItems.length > 0) {
    const resetInput = modifyQuestInputContract.parse({
      questId: reloaded.id,
      workItems: orphanedItems,
    });
    await questModifyBroker({ input: resetInput });
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

  // Per-slot sessionId memo — sessionId arrives on a later emission than the first entries, so memo the latest per slot.
  const slotIndexToSessionId = new Map<SlotIndex, SessionId>();

  questOrchestrationLoopBroker({
    processId,
    questId: reloaded.id,
    startPath,
    guildId,
    onAgentEntry: ({ slotIndex, entries, questWorkItemId, sessionId }): void => {
      const payload = buildOrchestrationLoopOnAgentEntryTransformer({
        processId,
        slotIndexToSessionId,
        slotIndex,
        entries,
        questId: reloaded.id,
        workItemId: questWorkItemId,
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
