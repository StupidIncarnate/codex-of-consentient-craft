/**
 * PURPOSE: Single-pass drain of the execution queue head — inspects status, runs orchestration loop if eligible, dequeues on terminal, recurses
 *
 * USAGE:
 * await drainOnceLayerBroker({
 *   getHead, dequeueHead, markHeadStarted, setHeadError,
 *   isWebPresent, runOrchestrationLoop, getQuestStatus,
 *   emitQueueUpdated, emitQueueError,
 * });
 * // Returns AdapterResult — the queue advances zero or more slots on each call.
 */

import type { AdapterResult, QuestQueueEntry, QuestStatus } from '@dungeonmaster/shared/contracts';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import {
  isActivelyExecutingQuestStatusGuard,
  isRecoverableQuestStatusGuard,
  isTerminalQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import { isQuestNotFoundErrorGuard } from '../../../guards/is-quest-not-found-error/is-quest-not-found-error-guard';

export const drainOnceLayerBroker = async ({
  getHead,
  dequeueHead,
  markHeadStarted,
  setHeadError,
  removeByQuestId,
  isWebPresent,
  runOrchestrationLoop,
  getQuestStatus,
  emitQueueUpdated,
  emitQueueError,
}: {
  getHead: () => QuestQueueEntry | undefined;
  dequeueHead: () => QuestQueueEntry | undefined;
  markHeadStarted: () => void;
  setHeadError: ({ message }: { message: string }) => void;
  removeByQuestId: ({ questId }: { questId: QuestQueueEntry['questId'] }) => void;
  isWebPresent: () => boolean;
  runOrchestrationLoop: ({
    questId,
    guildId,
  }: {
    questId: QuestQueueEntry['questId'];
    guildId: QuestQueueEntry['guildId'];
  }) => Promise<void>;
  getQuestStatus: ({
    questId,
    guildId,
  }: {
    questId: QuestQueueEntry['questId'];
    guildId: QuestQueueEntry['guildId'];
  }) => Promise<QuestStatus | undefined>;
  emitQueueUpdated: () => void;
  emitQueueError: ({ message }: { message: string }) => void;
}): Promise<AdapterResult> => {
  const ok = adapterResultContract.parse({ success: true });

  const head = getHead();
  if (head === undefined) {
    return ok;
  }
  if (!isWebPresent()) {
    return ok;
  }

  const currentStatus =
    (await getQuestStatus({ questId: head.questId, guildId: head.guildId })) ?? head.status;

  if (isUserPausedQuestStatusGuard({ status: currentStatus })) {
    return ok;
  }

  if (isTerminalQuestStatusGuard({ status: currentStatus })) {
    dequeueHead();
    emitQueueUpdated();
    await drainOnceLayerBroker({
      getHead,
      dequeueHead,
      markHeadStarted,
      setHeadError,
      removeByQuestId,
      isWebPresent,
      runOrchestrationLoop,
      getQuestStatus,
      emitQueueUpdated,
      emitQueueError,
    });
    return ok;
  }

  const eligible =
    isActivelyExecutingQuestStatusGuard({ status: currentStatus }) ||
    isRecoverableQuestStatusGuard({ status: currentStatus });
  if (!eligible) {
    return ok;
  }

  if (head.startedAt === undefined) {
    markHeadStarted();
    emitQueueUpdated();
  }

  try {
    await runOrchestrationLoop({ questId: head.questId, guildId: head.guildId });
  } catch (error: unknown) {
    if (isQuestNotFoundErrorGuard({ error })) {
      removeByQuestId({ questId: head.questId });
      emitQueueUpdated();
      await drainOnceLayerBroker({
        getHead,
        dequeueHead,
        markHeadStarted,
        setHeadError,
        removeByQuestId,
        isWebPresent,
        runOrchestrationLoop,
        getQuestStatus,
        emitQueueUpdated,
        emitQueueError,
      });
      return ok;
    }
    const message = error instanceof Error ? error.message : String(error);
    setHeadError({ message });
    emitQueueError({ message });
    return ok;
  }

  const afterStatus =
    (await getQuestStatus({ questId: head.questId, guildId: head.guildId })) ?? currentStatus;

  if (isTerminalQuestStatusGuard({ status: afterStatus })) {
    dequeueHead();
    emitQueueUpdated();
    await drainOnceLayerBroker({
      getHead,
      dequeueHead,
      markHeadStarted,
      setHeadError,
      removeByQuestId,
      isWebPresent,
      runOrchestrationLoop,
      getQuestStatus,
      emitQueueUpdated,
      emitQueueError,
    });
  }

  return ok;
};
