import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import type { QuestId } from '@dungeonmaster/shared/contracts';

import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { commentQueueStateProxy } from '../../state/comment-queue/comment-queue-state.proxy';

type QueuedEntry = ReturnType<typeof CommentQueueEntryStub>;

// The binding stamps every queued comment with `new Date().toISOString()`, so the queue instant is
// the one non-deterministic input a test cannot otherwise pin. Staged with a catch-all because
// toISOString takes no arguments — there is no address to discriminate on.
const DEFAULT_QUEUED_AT = '2026-07-28T10:00:00.000Z';

export const useCommentQueueBindingProxy = (): {
  setupEmptyQueue: () => void;
  setupQueuedComments: (params: { questId: QuestId; entries: QueuedEntry[] }) => void;
  queuedAt: () => QueuedEntry['createdAt'];
  hasStoredQueue: (params: { questId: QuestId }) => boolean;
  getStoredValue: (params: { questId: QuestId }) => unknown;
} => {
  const stateProxy = commentQueueStateProxy();
  const isoHandle = registerSpyOn({ object: Date.prototype, method: 'toISOString' });
  isoHandle.calledWith([]).returns(DEFAULT_QUEUED_AT);

  return {
    setupEmptyQueue: (): void => {
      stateProxy.setupEmptyStorage();
    },
    setupQueuedComments: ({
      questId,
      entries,
    }: {
      questId: QuestId;
      entries: QueuedEntry[];
    }): void => {
      stateProxy.seedQueue({ questId, entries });
    },
    queuedAt: (): QueuedEntry['createdAt'] =>
      CommentQueueEntryStub({ createdAt: DEFAULT_QUEUED_AT }).createdAt,
    hasStoredQueue: ({ questId }: { questId: QuestId }): boolean => stateProxy.hasKey({ questId }),
    getStoredValue: ({ questId }: { questId: QuestId }): unknown =>
      stateProxy.readRawValue({ questId }),
  };
};
