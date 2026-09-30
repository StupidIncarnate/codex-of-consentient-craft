import type { Quest } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStateProxy } from '../../state/comment-queue/comment-queue-state.proxy';

export const useCommentQueueSweepBindingProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: Quest['id']; entries: CommentQueueEntry[] }) => void;
  setupPrefixOnlyKey: (params: { value: string }) => void;
  hasStoredQueue: (params: { questId: Quest['id'] }) => boolean;
  getStoredValue: (params: { questId: Quest['id'] }) => unknown;
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
      questId: Quest['id'];
      entries: CommentQueueEntry[];
    }): void => {
      stateProxy.seedQueue({ questId, entries });
    },
    setupPrefixOnlyKey: ({ value }: { value: string }): void => {
      stateProxy.seedPrefixOnlyKey({ value });
    },
    hasStoredQueue: ({ questId }: { questId: Quest['id'] }): boolean =>
      stateProxy.hasKey({ questId }),
    getStoredValue: ({ questId }: { questId: Quest['id'] }): unknown =>
      stateProxy.readRawValue({ questId }),
    getPrefixOnlyValue: (): unknown => stateProxy.readPrefixOnlyValue(),
  };
};
