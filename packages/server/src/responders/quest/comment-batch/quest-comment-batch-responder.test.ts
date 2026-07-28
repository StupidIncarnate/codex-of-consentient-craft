import {
  AbsoluteFilePathStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestCommentBatchResponder } from './quest-comment-batch-responder';
import { QuestCommentBatchResponderProxy } from './quest-comment-batch-responder.proxy';

describe('QuestCommentBatchResponder', () => {
  describe('successful batch', () => {
    it('VALID: {batch whose anchors all resolve, chat work item with sessionId} => returns 200 with chatProcessId', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-comments' });
      const guildId = GuildIdStub();
      const chatProcessId = ProcessIdStub({ value: 'proc-comments' });
      const node = FlowNodeStub({ id: 'start', label: 'Start Page' });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
      });
      proxy.setupCommentBatch({ questId, chatProcessId });

      const result = await proxy.callResponder({
        params: { questId },
        body: { comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'This looks wrong' }] },
      });

      expect(result).toStrictEqual({
        status: 200,
        data: { chatProcessId: 'proc-comments' },
      });
    });

    it('VALID: {observable-anchored comment} => forwards the anchors and text verbatim to the orchestrator', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-comments' });
      const guildId = GuildIdStub();
      const observable = FlowObservableStub({ id: 'redirects-to-dashboard' });
      const node = FlowNodeStub({ id: 'start', label: 'Start Page', observables: [observable] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'glyphsmith', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId,
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
      });
      proxy.setupCommentBatch({
        questId,
        chatProcessId: ProcessIdStub({ value: 'proc-comments' }),
      });

      await proxy.callResponder({
        params: { questId },
        body: {
          comments: [
            {
              flowId: 'login-flow',
              nodeId: 'start',
              observableId: 'redirects-to-dashboard',
              text: 'This assertion is wrong',
            },
          ],
        },
      });

      expect(proxy.getDeliveredBatch({ questId })).toStrictEqual({
        guildId,
        sessionId,
        questId,
        comments: [
          {
            flowId: 'login-flow',
            nodeId: 'start',
            observableId: 'redirects-to-dashboard',
            text: 'This assertion is wrong',
          },
        ],
      });
    });
  });

  describe('stale anchors', () => {
    it('EDGE: {comment naming a nodeId absent from quest.flows} => returns 409 naming that anchor', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-comments' });
      const flow = FlowStub({ id: 'login-flow', nodes: [] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          comments: [{ flowId: 'login-flow', nodeId: 'deleted-node', text: 'This looks wrong' }],
        },
      });

      expect(result).toStrictEqual({
        status: 409,
        data: {
          error: 'Comment anchor no longer exists on the quest',
          staleAnchors: [{ flowId: 'login-flow', nodeId: 'deleted-node' }],
        },
      });
    });

    it('EDGE: {3 comments where 1 anchor is stale} => the 409 lists only the stale anchor', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-comments' });
      const liveNode = FlowNodeStub({ id: 'start', label: 'Start Page' });
      const otherNode = FlowNodeStub({ id: 'finish', label: 'Finish Page' });
      const flow = FlowStub({ id: 'login-flow', nodes: [liveNode, otherNode] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          comments: [
            { flowId: 'login-flow', nodeId: 'start', text: 'First' },
            { flowId: 'login-flow', nodeId: 'deleted-node', text: 'Second' },
            { flowId: 'login-flow', nodeId: 'finish', text: 'Third' },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 409,
        data: {
          error: 'Comment anchor no longer exists on the quest',
          staleAnchors: [{ flowId: 'login-flow', nodeId: 'deleted-node' }],
        },
      });
    });

    it('EDGE: {stale anchor} => spawns zero chat processes', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-comments' });
      const flow = FlowStub({ id: 'login-flow', nodes: [] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });

      await proxy.callResponder({
        params: { questId },
        body: {
          comments: [{ flowId: 'login-flow', nodeId: 'deleted-node', text: 'This looks wrong' }],
        },
      });

      expect(proxy.getDeliveryAttempts({ questId })).toStrictEqual([]);
    });

    it('EDGE: {comment naming an observableId deleted from a live node} => returns 409 carrying the observableId', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-comments' });
      const node = FlowNodeStub({ id: 'start', label: 'Start Page', observables: [] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: {
          comments: [
            {
              flowId: 'login-flow',
              nodeId: 'start',
              observableId: 'deleted-observable',
              text: 'This looks wrong',
            },
          ],
        },
      });

      expect(result).toStrictEqual({
        status: 409,
        data: {
          error: 'Comment anchor no longer exists on the quest',
          staleAnchors: [
            { flowId: 'login-flow', nodeId: 'start', observableId: 'deleted-observable' },
          ],
        },
      });
    });
  });

  describe('not-found cases', () => {
    it('EDGE: {quest with no chat work item sessionId} => returns 404', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const node = FlowNodeStub({ id: 'start', label: 'Start Page' });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const quest = QuestStub({ id: questId, flows: [flow], workItems: [] });

      proxy.setupQuestLoad({ quest });

      const result = await proxy.callResponder({
        params: { questId },
        body: { comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'This looks wrong' }] },
      });

      expect(result).toStrictEqual({
        status: 404,
        data: { error: 'No active chat session found for quest' },
      });
    });

    it('EDGE: {quest whose only chat work item carries no sessionId} => returns 404 and spawns zero chat processes', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const node = FlowNodeStub({ id: 'start', label: 'Start Page' });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer' })],
      });

      proxy.setupQuestLoad({ quest });

      await proxy.callResponder({
        params: { questId },
        body: { comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'This looks wrong' }] },
      });

      expect(proxy.getDeliveryAttempts({ questId })).toStrictEqual([]);
    });
  });

  describe('validation errors', () => {
    it('INVALID: {null params} => returns 400', async () => {
      QuestCommentBatchResponderProxy();

      const result = await QuestCommentBatchResponder({
        params: null,
        body: { comments: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Invalid params' },
      });
    });

    it('INVALID: {missing questId} => returns 400', async () => {
      QuestCommentBatchResponderProxy();

      const result = await QuestCommentBatchResponder({
        params: {},
        body: { comments: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'questId is required' },
      });
    });

    it('INVALID: {null body} => returns 400', async () => {
      QuestCommentBatchResponderProxy();

      const result = await QuestCommentBatchResponder({
        params: { questId: QuestIdStub() },
        body: null,
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Request body must be a JSON object' },
      });
    });

    it('EMPTY: {comments: []} => returns 400 with the empty-batch message', async () => {
      QuestCommentBatchResponderProxy();

      const result = await QuestCommentBatchResponder({
        params: { questId: QuestIdStub() },
        body: { comments: [] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'comments array is required and must not be empty' },
      });
    });

    it('INVALID: {body with no comments key} => returns 400 with the empty-batch message', async () => {
      QuestCommentBatchResponderProxy();

      const result = await QuestCommentBatchResponder({
        params: { questId: QuestIdStub() },
        body: {},
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'comments array is required and must not be empty' },
      });
    });

    it('INVALID: {comment entry with a malformed flowId} => returns 400 naming the entry fields', async () => {
      QuestCommentBatchResponderProxy();

      const result = await QuestCommentBatchResponder({
        params: { questId: QuestIdStub() },
        body: { comments: [{ flowId: 'Login Flow', nodeId: 'start', text: 'This looks wrong' }] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Each comment must carry a valid flowId, nodeId and text' },
      });
    });

    it('EMPTY: {comment entry with empty text} => returns 400 naming the entry fields', async () => {
      QuestCommentBatchResponderProxy();

      const result = await QuestCommentBatchResponder({
        params: { questId: QuestIdStub() },
        body: { comments: [{ flowId: 'login-flow', nodeId: 'start', text: '' }] },
      });

      expect(result).toStrictEqual({
        status: 400,
        data: { error: 'Each comment must carry a valid flowId, nodeId and text' },
      });
    });

    it('INVALID: {empty batch} => spawns zero chat processes', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();

      await QuestCommentBatchResponder({
        params: { questId },
        body: { comments: [] },
      });

      expect(proxy.getDeliveryAttempts({ questId })).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {load quest throws} => returns 500', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      proxy.setupQuestLoadError({ questId, error: new Error('Quest not found') });

      const result = await proxy.callResponder({
        params: { questId },
        body: { comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'This looks wrong' }] },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Quest not found' },
      });
    });

    it('ERROR: {persist throws inside the orchestrator} => returns 500 carrying no chatProcessId', async () => {
      const proxy = QuestCommentBatchResponderProxy();
      const questId = QuestIdStub();
      const sessionId = SessionIdStub({ value: 'session-comments' });
      const node = FlowNodeStub({ id: 'start', label: 'Start Page' });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const quest = QuestStub({
        id: questId,
        flows: [flow],
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupQuestLoad({ quest });
      proxy.setupFindQuestPath({
        questId,
        guildId: GuildIdStub(),
        questPath: AbsoluteFilePathStub({ value: '/q/path' }),
      });
      proxy.setupCommentBatchError({
        questId,
        message: 'Failed to persist comment batch: disk full',
      });

      const result = await proxy.callResponder({
        params: { questId },
        body: { comments: [{ flowId: 'login-flow', nodeId: 'start', text: 'This looks wrong' }] },
      });

      expect(result).toStrictEqual({
        status: 500,
        data: { error: 'Failed to persist comment batch: disk full' },
      });
    });
  });
});
