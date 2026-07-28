import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStateProxy } from '../../state/comment-queue/comment-queue-state.proxy';

export const useCommentQueueSweepBindingProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: CommentQueueEntry[] }) => void;
  hasStoredQueue: (params: { questId: QuestId }) => boolean;
  getStoredValue: (params: { questId: QuestId }) => unknown;
} => {
  const stateProxy = commentQueueStateProxy();

  return {
    setupEmptyQueue: (): void => {
      stateProxy.setupEmptyStorage();
    },
    setupQueuedComments: ({
      questId,
      entries,
    }: {
      questId: QuestId;
      entries: CommentQueueEntry[];
    }): void => {
      stateProxy.seedQueue({ questId, entries });
    },
    hasStoredQueue: ({ questId }: { questId: QuestId }): boolean => stateProxy.hasKey({ questId }),
    getStoredValue: ({ questId }: { questId: QuestId }): unknown =>
      stateProxy.readRawValue({ questId }),
  };
};
