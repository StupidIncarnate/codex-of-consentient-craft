import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

import { commentQueueState } from './comment-queue-state';

export const commentQueueStateProxy = (): {
  setupEmptyStorage: () => void;
  seedQueue: (params: { questId: QuestId; entries: CommentQueueEntry[] }) => void;
  seedRawValue: (params: { questId: QuestId; value: string }) => void;
  readRawValue: (params: { questId: QuestId }) => unknown;
  hasKey: (params: { questId: QuestId }) => boolean;
} => ({
  setupEmptyStorage: (): void => {
    localStorage.clear();
    commentQueueState.resetSubscribers();
  },

  seedQueue: ({ questId, entries }: { questId: QuestId; entries: CommentQueueEntry[] }): void => {
    localStorage.setItem(
      `${commentQueueStatics.storage.keyPrefix}${questId}`,
      JSON.stringify(entries),
    );
  },

  seedRawValue: ({ questId, value }: { questId: QuestId; value: string }): void => {
    localStorage.setItem(`${commentQueueStatics.storage.keyPrefix}${questId}`, value);
  },

  readRawValue: ({ questId }: { questId: QuestId }): unknown =>
    localStorage.getItem(`${commentQueueStatics.storage.keyPrefix}${questId}`),

  hasKey: ({ questId }: { questId: QuestId }): boolean =>
    localStorage.getItem(`${commentQueueStatics.storage.keyPrefix}${questId}`) !== null,
});
