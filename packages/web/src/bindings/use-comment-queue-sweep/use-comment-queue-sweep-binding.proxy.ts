import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStateProxy } from '../../state/comment-queue/comment-queue-state.proxy';

export const useCommentQueueSweepBindingProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: CommentQueueEntry[] }) => void;
  setupPrefixOnlyKey: (params: { value: string }) => void;
  hasStoredQueue: (params: { questId: QuestId }) => boolean;
  getStoredValue: (params: { questId: QuestId }) => unknown;
  getPrefixOnlyValue: () => unknown;
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
    setupPrefixOnlyKey: ({ value }: { value: string }): void => {
      stateProxy.seedPrefixOnlyKey({ value });
    },
    hasStoredQueue: ({ questId }: { questId: QuestId }): boolean => stateProxy.hasKey({ questId }),
    getStoredValue: ({ questId }: { questId: QuestId }): unknown =>
      stateProxy.readRawValue({ questId }),
    getPrefixOnlyValue: (): unknown => stateProxy.readPrefixOnlyValue(),
  };
};
