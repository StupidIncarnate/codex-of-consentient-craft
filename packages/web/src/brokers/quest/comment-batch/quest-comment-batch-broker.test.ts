import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { CommentAnchorStub } from '../../../contracts/comment-anchor/comment-anchor.stub';
import { CommentQueueEntryStub } from '../../../contracts/comment-queue-entry/comment-queue-entry.stub';

import { questCommentBatchBroker } from './quest-comment-batch-broker';
import { questCommentBatchBrokerProxy } from './quest-comment-batch-broker.proxy';

describe('questCommentBatchBroker', () => {
  describe('request body shape', () => {
    it('VALID: #check-post-body-shape {single node comment} => posts one array entry with flowId, nodeId, text and createdAt', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub({
        flowId: 'login-flow',
        nodeId: 'login-page',
        text: 'This assertion looks wrong',
        createdAt: '2026-07-01T12:00:00.000Z',
      });

      proxy.setupSent({ chatProcessId: 'proc-comment-batch' });

      await questCommentBatchBroker({ questId, comments: [entry] });

      expect(proxy.getRequestBody()).toStrictEqual({
        comments: [
          {
            flowId: 'login-flow',
            nodeId: 'login-page',
            text: 'This assertion looks wrong',
            createdAt: '2026-07-01T12:00:00.000Z',
          },
        ],
      });
    });

    it('VALID: #check-post-includes-observable-id {comment on a FLOW_OBSERVABLE_NODE} => posts observableId alongside flowId and nodeId', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub({
        flowId: 'login-flow',
        nodeId: 'login-page',
        observableId: 'login-redirects-to-dashboard',
        text: 'Verify this actually redirects',
        createdAt: '2026-07-01T12:05:00.000Z',
      });

      proxy.setupSent({ chatProcessId: 'proc-comment-batch' });

      await questCommentBatchBroker({ questId, comments: [entry] });

      expect(proxy.getRequestBody()).toStrictEqual({
        comments: [
          {
            flowId: 'login-flow',
            nodeId: 'login-page',
            observableId: 'login-redirects-to-dashboard',
            text: 'Verify this actually redirects',
            createdAt: '2026-07-01T12:05:00.000Z',
          },
        ],
      });
    });

    it('VALID: #check-post-omits-labels {queued comment} => posted entry carries no flow name, node label or observable description fields', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub({
        flowId: 'login-flow',
        nodeId: 'login-page',
        observableId: 'login-redirects-to-dashboard',
        text: 'Verify this actually redirects',
        createdAt: '2026-07-01T12:05:00.000Z',
      });

      proxy.setupSent({ chatProcessId: 'proc-comment-batch' });

      await questCommentBatchBroker({ questId, comments: [entry] });

      const body = proxy.getRequestBody();

      // toStrictEqual on the whole posted entry proves the key set is exactly
      // {flowId, nodeId, observableId, text, createdAt} — no flowName/nodeLabel/description keys.
      expect(body).toStrictEqual({
        comments: [
          {
            flowId: 'login-flow',
            nodeId: 'login-page',
            observableId: 'login-redirects-to-dashboard',
            text: 'Verify this actually redirects',
            createdAt: '2026-07-01T12:05:00.000Z',
          },
        ],
      });
    });

    it('VALID: {multiple queued comments} => posts one array entry per comment in order', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const first = CommentQueueEntryStub({
        flowId: 'login-flow',
        nodeId: 'login-page',
        text: 'First comment',
        createdAt: '2026-07-01T12:00:00.000Z',
      });
      const second = CommentQueueEntryStub({
        flowId: 'signup-flow',
        nodeId: 'signup-page',
        observableId: 'signup-sends-email',
        text: 'Second comment',
        createdAt: '2026-07-01T12:10:00.000Z',
      });

      proxy.setupSent({ chatProcessId: 'proc-comment-batch' });

      await questCommentBatchBroker({ questId, comments: [first, second] });

      expect(proxy.getRequestBody()).toStrictEqual({
        comments: [
          {
            flowId: 'login-flow',
            nodeId: 'login-page',
            text: 'First comment',
            createdAt: '2026-07-01T12:00:00.000Z',
          },
          {
            flowId: 'signup-flow',
            nodeId: 'signup-page',
            observableId: 'signup-sends-email',
            text: 'Second comment',
            createdAt: '2026-07-01T12:10:00.000Z',
          },
        ],
      });
    });
  });

  describe('200 success', () => {
    it('VALID: #check-200-with-chat-process-id {200 with chatProcessId} => returns sent outcome with chatProcessId', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupSent({ chatProcessId: 'proc-comment-batch' });

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({ outcome: 'sent', chatProcessId: 'proc-comment-batch' });
    });

    it('EDGE: {200 without chatProcessId} => returns failed outcome naming the missing field', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupSentWithoutChatProcessId();

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({
        outcome: 'failed',
        error: 'POST /api/quests/add-auth/comments returned 200 with no chatProcessId',
      });
    });

    it('EDGE: {200 with an unparseable body} => returns failed outcome naming the missing field', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupSentUnparseableBody();

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({
        outcome: 'failed',
        error: 'POST /api/quests/add-auth/comments returned 200 with no chatProcessId',
      });
    });
  });

  describe('409 stale anchors', () => {
    it('VALID: #check-409-lists-stale-anchors {409 with two of three anchors stale} => returns stale outcome naming only the anchors that failed to resolve', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const resolvedEntry = CommentQueueEntryStub({ flowId: 'login-flow', nodeId: 'login-page' });
      const staleEntryOne = CommentQueueEntryStub({
        flowId: 'signup-flow',
        nodeId: 'deleted-node',
      });
      const staleEntryTwo = CommentQueueEntryStub({
        flowId: 'checkout-flow',
        nodeId: 'removed-step',
      });
      const staleAnchors = [
        CommentAnchorStub({ flowId: 'signup-flow', nodeId: 'deleted-node' }),
        CommentAnchorStub({ flowId: 'checkout-flow', nodeId: 'removed-step' }),
      ];

      proxy.setupStaleAnchors({ staleAnchors });

      const result = await questCommentBatchBroker({
        questId,
        comments: [resolvedEntry, staleEntryOne, staleEntryTwo],
      });

      expect(result).toStrictEqual({
        outcome: 'stale',
        staleAnchors: [
          { flowId: 'signup-flow', nodeId: 'deleted-node' },
          { flowId: 'checkout-flow', nodeId: 'removed-step' },
        ],
      });
    });

    it('EDGE: {409 with an empty staleAnchors array} => returns failed outcome naming that no anchors were listed', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupStaleAnchorsEmpty();

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({
        outcome: 'failed',
        error: 'POST /api/quests/add-auth/comments returned 409 with no stale anchors',
      });
    });
  });

  describe('other failure statuses', () => {
    it('ERROR: {400 bad request} => returns failed outcome with a generic status message', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupBadRequest();

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({
        outcome: 'failed',
        error: 'POST /api/quests/add-auth/comments failed with status 400',
      });
    });

    it('ERROR: {404 not found} => returns failed outcome with a generic status message', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupNotFound();

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({
        outcome: 'failed',
        error: 'POST /api/quests/add-auth/comments failed with status 404',
      });
    });

    it('ERROR: #check-persist-failure-500 {quest write throws, 500 with error body} => returns failed outcome with the server error message and no chatProcessId', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupServerError({ error: 'Quest write failed' });

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({ outcome: 'failed', error: 'Quest write failed' });
    });

    it('ERROR: {500 with no body} => returns failed outcome with a generic status message', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupServerErrorNoBody();

      const result = await questCommentBatchBroker({ questId, comments: [entry] });

      expect(result).toStrictEqual({
        outcome: 'failed',
        error: 'POST /api/quests/add-auth/comments failed with status 500',
      });
    });
  });

  describe('network failure', () => {
    it('ERROR: {network failure before any response} => rejects so the calling widget catches it and leaves the queue intact', async () => {
      const proxy = questCommentBatchBrokerProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const entry = CommentQueueEntryStub();

      proxy.setupNetworkError();

      await expect(questCommentBatchBroker({ questId, comments: [entry] })).rejects.toThrow(
        /fetch/iu,
      );
    });
  });
});
