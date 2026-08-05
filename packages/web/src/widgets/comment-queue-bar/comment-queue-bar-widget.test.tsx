import { waitFor } from '@testing-library/react';

import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { mantineRenderAdapter } from '../../adapters/mantine/render/mantine-render-adapter';
import { CommentAnchorStub } from '../../contracts/comment-anchor/comment-anchor.stub';
import { CommentQueueEntryStub } from '../../contracts/comment-queue-entry/comment-queue-entry.stub';

import { CommentQueueBarWidget } from './comment-queue-bar-widget';
import { CommentQueueBarWidgetProxy } from './comment-queue-bar-widget.proxy';

const QUEST_ID = QuestIdStub({ value: 'quest-a' });

describe('CommentQueueBarWidget', () => {
  describe('empty queue', () => {
    it('EMPTY: {no queued comments} => COMMENT_QUEUE_BAR is absent when the queue for this quest is empty', () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupEmptyQueue();

      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      expect(proxy.hasBar()).toBe(false);
    });
  });

  describe('queued count', () => {
    it('VALID: {one comment queued} => COMMENT_QUEUE_BAR reads 1 COMMENT QUEUED after queueing the first comment', () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });

      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      expect(proxy.getCountText()).toBe('1 COMMENT QUEUED');
    });

    it('VALID: {three comments queued} => COMMENT_QUEUE_BAR reads 3 COMMENTS QUEUED when three comments are queued', () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [
          CommentQueueEntryStub({ flowId: 'flow-a', nodeId: 'node-a' }),
          CommentQueueEntryStub({ flowId: 'flow-b', nodeId: 'node-b' }),
          CommentQueueEntryStub({ flowId: 'flow-c', nodeId: 'node-c' }),
        ],
      });

      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      expect(proxy.getCountText()).toBe('3 COMMENTS QUEUED');
    });

    it('VALID: {queue rendered} => COMMENT_QUEUE_BAR contains COMMENT_CLEAR_BUTTON and COMMENT_SEND_BUTTON', () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });

      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      expect(proxy.hasClearButton()).toBe(true);
      expect(proxy.hasSendButton()).toBe(true);
    });
  });

  describe('clear', () => {
    it('VALID: {click COMMENT_CLEAR_BUTTON} => the dungeonmaster-quest-comments-{questId} key is absent from localStorage after clicking', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickClear();

      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(false);
    });

    it('VALID: {click COMMENT_CLEAR_BUTTON} => calls onSend zero times', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickClear();

      expect(proxy.getRequestCount()).toBe(0);
    });
  });

  describe('send success', () => {
    it('VALID: {send succeeds} => COMMENT_QUEUE_BAR is absent after a successful send', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      proxy.setupSendSucceeds({ chatProcessId: 'proc-1' });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.hasBar()).toBe(false);
      });

      expect(proxy.hasBar()).toBe(false);
    });

    it('VALID: {send} => onSend receives one { flowId, nodeId, text, createdAt } entry per queued comment', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [
          CommentQueueEntryStub({
            flowId: 'login-flow',
            nodeId: 'login-page',
            text: 'first comment',
            createdAt: '2026-01-01T00:00:00.000Z',
          }),
          CommentQueueEntryStub({
            flowId: 'login-flow',
            nodeId: 'submit',
            text: 'second comment',
            createdAt: '2026-01-02T00:00:00.000Z',
          }),
        ],
      });
      proxy.setupSendSucceeds({ chatProcessId: 'proc-1' });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getRequestCount()).toBe(1);
      });

      expect(proxy.getRequestBody()).toStrictEqual([
        {
          flowId: 'login-flow',
          nodeId: 'login-page',
          text: 'first comment',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          flowId: 'login-flow',
          nodeId: 'submit',
          text: 'second comment',
          createdAt: '2026-01-02T00:00:00.000Z',
        },
      ]);
    });
  });

  describe('send server error', () => {
    it('ERROR: {failed outcome then sent outcome} => the dungeonmaster-quest-comments-{questId} key survives the failure and is removed only after the send succeeds', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      proxy.setupSendServerError({ error: 'Quest write failed' });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();
      await waitFor(() => {
        expect(proxy.getRequestCount()).toBe(1);
      });

      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(true);

      proxy.setupSendSucceeds({ chatProcessId: 'proc-1' });
      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(false);
      });

      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(false);
    });

    it('ERROR: {failed outcome} => shows the server error message as a red toast', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      proxy.setupSendServerError({ error: 'Quest write failed' });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: 'Quest write failed',
          color: 'red',
        });
      });

      expect(proxy.getShownToast()).toStrictEqual({ message: 'Quest write failed', color: 'red' });
    });
  });

  describe('send network failure', () => {
    it('ERROR: {onSend rejects before any response arrives} => the dungeonmaster-quest-comments-{questId} key retains every entry', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      proxy.setupSendNetworkError();
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: 'Failed to send comments — check your connection and try again.',
          color: 'red',
        });
      });

      expect(proxy.hasStoredQueue({ questId: QUEST_ID })).toBe(true);
    });

    it('ERROR: {onSend rejects before any response arrives} => shows the app standard error notification and leaves COMMENT_QUEUE_BAR visible with its count unchanged', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      proxy.setupSendNetworkError();
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message: 'Failed to send comments — check your connection and try again.',
          color: 'red',
        });
      });

      expect(proxy.hasBar()).toBe(true);
      expect(proxy.getCountText()).toBe('1 COMMENT QUEUED');
    });
  });

  describe('send stale anchors', () => {
    it('EDGE: {3 queued, 1 stale} => the dungeonmaster-quest-comments-{questId} array retains exactly the 2 comments whose anchors still resolve', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      const survivorOne = CommentQueueEntryStub({
        flowId: 'flow-a',
        nodeId: 'node-a',
        text: 'keep me',
        createdAt: '2026-01-01T00:00:00.000Z',
      });
      const staleEntry = CommentQueueEntryStub({
        flowId: 'flow-b',
        nodeId: 'node-b',
        text: 'drop me',
        createdAt: '2026-01-02T00:00:00.000Z',
      });
      const survivorTwo = CommentQueueEntryStub({
        flowId: 'flow-c',
        nodeId: 'node-c',
        text: 'keep me too',
        createdAt: '2026-01-03T00:00:00.000Z',
      });
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [survivorOne, staleEntry, survivorTwo],
      });
      proxy.setupSendStale({
        staleAnchors: [CommentAnchorStub({ flowId: 'flow-b', nodeId: 'node-b' })],
      });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getStoredValue({ questId: QUEST_ID })).toBe(
          JSON.stringify([survivorOne, survivorTwo]),
        );
      });

      expect(proxy.getStoredValue({ questId: QUEST_ID })).toBe(
        JSON.stringify([survivorOne, survivorTwo]),
      );
    });

    it('EDGE: {3 queued, 1 stale} => an error notification names the deleted box, so the user learns which comment was discarded and why', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [
          CommentQueueEntryStub({ flowId: 'flow-a', nodeId: 'node-a' }),
          CommentQueueEntryStub({ flowId: 'flow-b', nodeId: 'node-b' }),
          CommentQueueEntryStub({ flowId: 'flow-c', nodeId: 'node-c' }),
        ],
      });
      proxy.setupSendStale({
        staleAnchors: [CommentAnchorStub({ flowId: 'flow-b', nodeId: 'node-b' })],
      });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getShownToast()).toStrictEqual({
          message:
            'Dropped 1 queued comment — its box no longer exists on the quest: flow-b / node-b',
          color: 'red',
        });
      });

      expect(proxy.getShownToast()).toStrictEqual({
        message:
          'Dropped 1 queued comment — its box no longer exists on the quest: flow-b / node-b',
        color: 'red',
      });
    });

    it('EDGE: {3 queued, 1 stale} => COMMENT_QUEUE_BAR reads 2 COMMENTS QUEUED after one of three entries is pruned as stale', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({
        questId: QUEST_ID,
        entries: [
          CommentQueueEntryStub({ flowId: 'flow-a', nodeId: 'node-a' }),
          CommentQueueEntryStub({ flowId: 'flow-b', nodeId: 'node-b' }),
          CommentQueueEntryStub({ flowId: 'flow-c', nodeId: 'node-c' }),
        ],
      });
      proxy.setupSendStale({
        staleAnchors: [CommentAnchorStub({ flowId: 'flow-b', nodeId: 'node-b' })],
      });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.getCountText()).toBe('2 COMMENTS QUEUED');
      });

      expect(proxy.getCountText()).toBe('2 COMMENTS QUEUED');
    });
  });

  describe('double-click guard', () => {
    it('EDGE: {click COMMENT_SEND_BUTTON twice before the first send resolves} => calls onSend exactly once', async () => {
      const proxy = CommentQueueBarWidgetProxy();
      proxy.setupQueuedComments({ questId: QUEST_ID, entries: [CommentQueueEntryStub()] });
      proxy.setupSendSucceeds({ chatProcessId: 'proc-1' });
      mantineRenderAdapter({
        ui: <CommentQueueBarWidget questId={QUEST_ID} onSend={proxy.onSend} />,
      });

      await proxy.clickSend();
      await proxy.clickSend();

      await waitFor(() => {
        expect(proxy.hasBar()).toBe(false);
      });

      expect(proxy.getRequestCount()).toBe(1);
    });
  });
});
