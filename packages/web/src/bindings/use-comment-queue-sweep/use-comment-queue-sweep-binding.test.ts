import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';
import { commentQueueStatics } from '../../statics/comment-queue/comment-queue-statics';

import { useCommentQueueSweepBinding } from './use-comment-queue-sweep-binding';
import { useCommentQueueSweepBindingProxy } from './use-comment-queue-sweep-binding.proxy';

const DAY_MS = commentQueueStatics.expiry.msPerDay;

describe('useCommentQueueSweepBinding', () => {
  describe('mount purge', () => {
    it('VALID: {entry 8 days old} => is dropped on mount', () => {
      const proxy = useCommentQueueSweepBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.setupQueuedComments({
        questId,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(Date.now() - 8 * DAY_MS).toISOString() }),
        ],
      });

      testingLibraryRenderHookAdapter({ renderCallback: () => useCommentQueueSweepBinding() });

      expect(proxy.hasStoredQueue({ questId })).toBe(false);
    });

    it('VALID: {entry 6 days old} => survives the mount', () => {
      const proxy = useCommentQueueSweepBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      const fresh = [
        CommentQueueEntryStub({ createdAt: new Date(Date.now() - 6 * DAY_MS).toISOString() }),
      ];
      proxy.setupQueuedComments({ questId, entries: fresh });

      testingLibraryRenderHookAdapter({ renderCallback: () => useCommentQueueSweepBinding() });

      expect(proxy.getStoredValue({ questId })).toBe(JSON.stringify(fresh));
    });

    it('VALID: {one 8-day-old and one 1-day-old entry} => retains exactly the 1-day-old entry', () => {
      const proxy = useCommentQueueSweepBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      const stale = CommentQueueEntryStub({
        nodeId: 'login-page',
        createdAt: new Date(Date.now() - 8 * DAY_MS).toISOString(),
      });
      const fresh = CommentQueueEntryStub({
        nodeId: 'dashboard',
        createdAt: new Date(Date.now() - DAY_MS).toISOString(),
      });
      proxy.setupQueuedComments({ questId, entries: [stale, fresh] });

      testingLibraryRenderHookAdapter({ renderCallback: () => useCommentQueueSweepBinding() });

      expect(proxy.getStoredValue({ questId })).toBe(JSON.stringify([fresh]));
    });

    it("VALID: {a second quest holds only fresh entries} => that quest's key is left intact", () => {
      const proxy = useCommentQueueSweepBindingProxy();
      proxy.setupEmptyQueue();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      const otherEntries = [
        CommentQueueEntryStub({ createdAt: new Date(Date.now() - DAY_MS).toISOString() }),
      ];
      proxy.setupQueuedComments({
        questId: questA,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(Date.now() - 8 * DAY_MS).toISOString() }),
        ],
      });
      proxy.setupQueuedComments({ questId: questB, entries: otherEntries });

      testingLibraryRenderHookAdapter({ renderCallback: () => useCommentQueueSweepBinding() });

      expect(proxy.hasStoredQueue({ questId: questA })).toBe(false);
      expect(proxy.getStoredValue({ questId: questB })).toBe(JSON.stringify(otherEntries));
    });

    it('VALID: {two different quests each holding only expired entries} => the mount removes both keys in one pass', () => {
      const proxy = useCommentQueueSweepBindingProxy();
      proxy.setupEmptyQueue();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      proxy.setupQueuedComments({
        questId: questA,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(Date.now() - 8 * DAY_MS).toISOString() }),
        ],
      });
      proxy.setupQueuedComments({
        questId: questB,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(Date.now() - 9 * DAY_MS).toISOString() }),
        ],
      });

      testingLibraryRenderHookAdapter({ renderCallback: () => useCommentQueueSweepBinding() });

      // Two keys that BOTH need removing is the only shape that proves the scan snapshots its key
      // list before mutating: removing the first key re-indexes localStorage, so a live index walk
      // would slide the second key into an already-visited slot and leave it behind forever. Every
      // other case here pairs one expiring key with one surviving key, where that skip is invisible.
      expect(proxy.hasStoredQueue({ questId: questA })).toBe(false);
      expect(proxy.hasStoredQueue({ questId: questB })).toBe(false);
    });

    it('EDGE: {a key equal to the bare prefix carrying no questId} => the mount leaves it untouched and still purges a real quest key', () => {
      const proxy = useCommentQueueSweepBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      const prefixOnlyValue = JSON.stringify([
        CommentQueueEntryStub({ createdAt: new Date(Date.now() - 8 * DAY_MS).toISOString() }),
      ]);
      proxy.setupPrefixOnlyKey({ value: prefixOnlyValue });
      proxy.setupQueuedComments({
        questId,
        entries: [
          CommentQueueEntryStub({ createdAt: new Date(Date.now() - 8 * DAY_MS).toISOString() }),
        ],
      });

      testingLibraryRenderHookAdapter({ renderCallback: () => useCommentQueueSweepBinding() });

      // The bare prefix addresses no quest, so slicing a questId out of it yields an empty string
      // that questIdContract rejects — sweeping it would throw out of the mount effect and take the
      // whole quest route down. It is skipped whole, expired contents and all...
      expect(proxy.getPrefixOnlyValue()).toBe(prefixOnlyValue);
      // ...and the skip is scoped to that one key rather than abandoning the rest of the scan.
      expect(proxy.hasStoredQueue({ questId })).toBe(false);
    });

    it('EMPTY: {no comment queue keys at all} => mount completes and reports success', () => {
      const proxy = useCommentQueueSweepBindingProxy();
      proxy.setupEmptyQueue();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueSweepBinding(),
      });

      expect(result.current).toStrictEqual({ success: true });
    });
  });
});
