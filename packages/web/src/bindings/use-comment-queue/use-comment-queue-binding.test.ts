import { CommentTextStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';

import { useCommentQueueBinding } from './use-comment-queue-binding';
import { useCommentQueueBindingProxy } from './use-comment-queue-binding.proxy';

describe('useCommentQueueBinding', () => {
  describe('initial read', () => {
    it('EMPTY: {no stored queue} => entries is empty', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });

      expect(result.current.entries).toStrictEqual([]);
    });

    it('VALID: {two stored entries} => entries restores both on mount', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      const first = CommentQueueEntryStub({ nodeId: 'login-page' });
      const second = CommentQueueEntryStub({ nodeId: 'dashboard' });
      proxy.setupQueuedComments({ questId, entries: [first, second] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });

      expect(result.current.entries).toStrictEqual([first, second]);
    });

    it("VALID: {another quest's queue is populated} => entries stays empty for this quest", () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      proxy.setupQueuedComments({ questId: questB, entries: [CommentQueueEntryStub({})] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId: questA }),
      });

      expect(result.current.entries).toStrictEqual([]);
    });
  });

  describe('questId change', () => {
    it('VALID: {questId switches while mounted to a quest with its own queue} => entries re-read for the newly mounted quest', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      const entryA = CommentQueueEntryStub({ nodeId: 'login-page', text: 'the note on quest a' });
      const entryB = CommentQueueEntryStub({ nodeId: 'dashboard', text: 'the note on quest b' });
      proxy.setupQueuedComments({ questId: questA, entries: [entryA] });
      proxy.setupQueuedComments({ questId: questB, entries: [entryB] });

      // The hook stays MOUNTED across the switch — only the questId it is handed changes, the shape
      // a route param change produces. Without the re-read the previous quest's queue would linger
      // under the new quest's boxes and toolbar count.
      let activeQuestId = questA;

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId: activeQuestId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          activeQuestId = questB;
          rerender();
        },
      });

      expect(result.current.entries).toStrictEqual([entryB]);
    });

    it('EMPTY: {questId switches while mounted to a quest with no queue} => entries empties rather than keeping the previous quest entries', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questA = QuestIdStub({ value: 'quest-a' });
      const questB = QuestIdStub({ value: 'quest-b' });
      proxy.setupQueuedComments({
        questId: questA,
        entries: [CommentQueueEntryStub({ nodeId: 'login-page' })],
      });

      let activeQuestId = questA;

      const { result, rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId: activeQuestId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          activeQuestId = questB;
          rerender();
        },
      });

      expect(result.current.entries).toStrictEqual([]);
    });
  });

  describe('entryFor()', () => {
    it('VALID: {anchor matching a queued node comment} => returns that entry', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      const entry = CommentQueueEntryStub({ nodeId: 'login-page' });
      proxy.setupQueuedComments({ questId, entries: [entry] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });

      expect(
        result.current.entryFor({ anchor: CommentAnchorStub({ nodeId: 'login-page' }) }),
      ).toStrictEqual(entry);
    });

    it('EMPTY: {anchor with nothing queued} => returns undefined', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });

      expect(result.current.entryFor({ anchor: CommentAnchorStub({}) })).toBe(undefined);
    });

    it('VALID: {observable anchor while only its parent node is queued} => returns undefined', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.setupQueuedComments({
        questId,
        entries: [CommentQueueEntryStub({ nodeId: 'login-page' })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });

      expect(
        result.current.entryFor({
          anchor: CommentAnchorStub({
            nodeId: 'login-page',
            observableId: 'login-redirects-to-dashboard',
          }),
        }),
      ).toBe(undefined);
    });
  });

  describe('queueComment()', () => {
    it('VALID: {queue onto an empty queue} => entries holds the anchor and text', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          result.current.queueComment({
            anchor: CommentAnchorStub({ nodeId: 'login-page' }),
            text: CommentTextStub({ value: 'this step is wrong' }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        {
          flowId: 'login-flow',
          nodeId: 'login-page',
          text: 'this step is wrong',
          createdAt: proxy.queuedAt(),
        },
      ]);
    });

    it('VALID: {queue on an observable anchor} => the stored entry carries observableId', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          result.current.queueComment({
            anchor: CommentAnchorStub({
              nodeId: 'login-page',
              observableId: 'login-redirects-to-dashboard',
            }),
            text: CommentTextStub({ value: 'this assertion is wrong' }),
          });
        },
      });

      expect(result.current.entries).toStrictEqual([
        {
          flowId: 'login-flow',
          nodeId: 'login-page',
          observableId: 'login-redirects-to-dashboard',
          text: 'this assertion is wrong',
          createdAt: proxy.queuedAt(),
        },
      ]);
    });

    it('VALID: {re-queue the same anchor} => replaces the entry and bumps createdAt past the original', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      const original = CommentQueueEntryStub({
        nodeId: 'login-page',
        text: 'first draft',
        createdAt: '2020-01-01T00:00:00.000Z',
      });
      proxy.setupQueuedComments({ questId, entries: [original] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          result.current.queueComment({
            anchor: CommentAnchorStub({ nodeId: 'login-page' }),
            text: CommentTextStub({ value: 'edited text' }),
          });
        },
      });

      // The replacement carries the edit-time stamp, not the original's — an actively edited
      // comment can never be swept for the age of a draft the user already replaced.
      expect(result.current.entries).toStrictEqual([
        {
          flowId: 'login-flow',
          nodeId: 'login-page',
          text: 'edited text',
          createdAt: proxy.queuedAt(),
        },
      ]);
      expect(original.createdAt).toBe('2020-01-01T00:00:00.000Z');
    });
  });

  describe('deleteComment()', () => {
    it('VALID: {delete the only queued comment} => entries empties and the stored key is gone', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.setupQueuedComments({ questId, entries: [CommentQueueEntryStub({})] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          result.current.deleteComment({ anchor: CommentAnchorStub({}) });
        },
      });

      expect(result.current.entries).toStrictEqual([]);
      expect(proxy.hasStoredQueue({ questId })).toBe(false);
    });

    it('VALID: {delete one of two} => exactly the other remains', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      const kept = CommentQueueEntryStub({ nodeId: 'dashboard' });
      proxy.setupQueuedComments({
        questId,
        entries: [CommentQueueEntryStub({ nodeId: 'login-page' }), kept],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          result.current.deleteComment({ anchor: CommentAnchorStub({ nodeId: 'login-page' }) });
        },
      });

      expect(result.current.entries).toStrictEqual([kept]);
    });
  });

  describe('clearQueue()', () => {
    it('VALID: {clear a populated queue} => entries empties and the stored key is gone', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });
      proxy.setupQueuedComments({
        questId,
        entries: [
          CommentQueueEntryStub({ nodeId: 'login-page' }),
          CommentQueueEntryStub({ nodeId: 'dashboard' }),
        ],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          result.current.clearQueue();
        },
      });

      expect(result.current.entries).toStrictEqual([]);
      expect(proxy.hasStoredQueue({ questId })).toBe(false);
    });
  });

  describe('cross-consumer synchronisation', () => {
    it('VALID: {a second hook queues a comment} => the first hook re-renders with that entry', () => {
      const proxy = useCommentQueueBindingProxy();
      proxy.setupEmptyQueue();
      const questId = QuestIdStub({ value: 'quest-a' });

      const first = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      const second = testingLibraryRenderHookAdapter({
        renderCallback: () => useCommentQueueBinding({ questId }),
      });
      testingLibraryActAdapter({
        callback: () => {
          second.result.current.queueComment({
            anchor: CommentAnchorStub({ nodeId: 'login-page' }),
            text: CommentTextStub({ value: 'shared store update' }),
          });
        },
      });

      expect(first.result.current.entries).toStrictEqual([
        {
          flowId: 'login-flow',
          nodeId: 'login-page',
          text: 'shared store update',
          createdAt: proxy.queuedAt(),
        },
      ]);
    });
  });
});
