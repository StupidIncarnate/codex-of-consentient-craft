import type { QuestId } from '@dungeonmaster/shared/contracts';

import type { CommentQueueEntry } from '../../contracts/comment-queue-entry/comment-queue-entry-contract';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

import { commentQueueState } from './comment-queue-state';

export const commentQueueStateProxy = (): {
  setupEmptyStorage: () => void;
  seedQueue: (params: { questId: QuestId; entries: CommentQueueEntry[] }) => void;
  seedRawValue: (params: { questId: QuestId; value: string }) => void;
  seedPrefixOnlyKey: (params: { value: string }) => void;
  readRawValue: (params: { questId: QuestId }) => unknown;
  readPrefixOnlyValue: () => unknown;
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

  // The key equal to the bare prefix, carrying no questId at all. Nothing in the app writes it —
  // a hand-edited or foreign-tab localStorage can. It exists here so a test can prove the scan
  // skips it rather than slicing an empty questId out of it.
  seedPrefixOnlyKey: ({ value }: { value: string }): void => {
    localStorage.setItem(commentQueueStatics.storage.keyPrefix, value);
  },

  readRawValue: ({ questId }: { questId: QuestId }): unknown =>
    localStorage.getItem(`${commentQueueStatics.storage.keyPrefix}${questId}`),

  readPrefixOnlyValue: (): unknown => localStorage.getItem(commentQueueStatics.storage.keyPrefix),

  hasKey: ({ questId }: { questId: QuestId }): boolean =>
    localStorage.getItem(`${commentQueueStatics.storage.keyPrefix}${questId}`) !== null,
});
