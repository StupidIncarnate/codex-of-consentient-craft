import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestCommentStub,
} from '@dungeonmaster/shared/contracts';

import { commentBatchToMarkdownTransformer } from './comment-batch-to-markdown-transformer';

describe('commentBatchToMarkdownTransformer', () => {
  describe('node-anchored comment', () => {
    it('VALID: {single comment anchored to an existing flow+node} => renders the node context block', () => {
      const node = FlowNodeStub({ id: 'start', label: 'Start Page' });
      const flow = FlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        nodes: [node],
      });
      const comment = QuestCommentStub({});

      const result = commentBatchToMarkdownTransformer({ comments: [comment], flows: [flow] });

      expect(result).toBe(
        'Flow "Login Flow" / node `start` ("Start Page")\nUser Comment: This assertion looks wrong',
      );
    });
  });

  describe('observable-anchored comment', () => {
    it('VALID: {single comment anchored to an existing flow+node+observable} => renders the observable context block', () => {
      const observable = FlowObservableStub({
        id: 'obs-1',
        description: 'redirects to dashboard',
      });
      const node = FlowNodeStub({
        id: 'start',
        label: 'Start Page',
        observables: [observable],
      });
      const flow = FlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        nodes: [node],
      });
      const comment = QuestCommentStub({ observableId: 'obs-1' });

      const result = commentBatchToMarkdownTransformer({ comments: [comment], flows: [flow] });

      expect(result).toBe(
        'Flow "Login Flow" / observable `obs-1` ("redirects to dashboard") on node `start`\nUser Comment: This assertion looks wrong',
      );
    });
  });

  describe('batch dividers', () => {
    it('VALID: {batch of three comments} => joins the three blocks with exactly two "---" dividers', () => {
      const node = FlowNodeStub({ id: 'start', label: 'Start Page' });
      const flow = FlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        nodes: [node],
      });
      const first = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001',
        text: 'First comment',
      });
      const second = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002',
        text: 'Second comment',
      });
      const third = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d003',
        text: 'Third comment',
      });

      const result = commentBatchToMarkdownTransformer({
        comments: [first, second, third],
        flows: [flow],
      });

      expect(result).toBe(
        'Flow "Login Flow" / node `start` ("Start Page")\nUser Comment: First comment' +
          '\n\n---\n\n' +
          'Flow "Login Flow" / node `start` ("Start Page")\nUser Comment: Second comment' +
          '\n\n---\n\n' +
          'Flow "Login Flow" / node `start` ("Start Page")\nUser Comment: Third comment',
      );
    });
  });

  describe('fallback: flow absent', () => {
    it('EDGE: {comment anchored to a flow missing from quest.flows} => flowName falls back to the raw flowId', () => {
      const comment = QuestCommentStub({ flowId: 'missing-flow' });

      const result = commentBatchToMarkdownTransformer({ comments: [comment], flows: [] });

      expect(result).toBe(
        'Flow "missing-flow" / node `start` ("start")\nUser Comment: This assertion looks wrong',
      );
    });
  });

  describe('fallback: node absent', () => {
    it('EDGE: {comment anchored to a node missing from its flow} => nodeLabel falls back to the raw nodeId', () => {
      const flow = FlowStub({ id: 'login-flow', name: 'Login Flow', nodes: [] });
      const comment = QuestCommentStub({ nodeId: 'missing-node' });

      const result = commentBatchToMarkdownTransformer({ comments: [comment], flows: [flow] });

      expect(result).toBe(
        'Flow "Login Flow" / node `missing-node` ("missing-node")\nUser Comment: This assertion looks wrong',
      );
    });
  });

  describe('fallback: observable absent', () => {
    it('EDGE: {observableId set but missing from its node} => description falls back to the raw observableId', () => {
      const node = FlowNodeStub({
        id: 'start',
        label: 'Start Page',
        observables: [],
      });
      const flow = FlowStub({
        id: 'login-flow',
        name: 'Login Flow',
        nodes: [node],
      });
      const comment = QuestCommentStub({ observableId: 'missing-obs' });

      const result = commentBatchToMarkdownTransformer({ comments: [comment], flows: [flow] });

      expect(result).toBe(
        'Flow "Login Flow" / observable `missing-obs` ("missing-obs") on node `start`\nUser Comment: This assertion looks wrong',
      );
    });
  });

  describe('empty batch', () => {
    it('EMPTY: {comments: []} => throws rather than returning an empty PromptText', () => {
      expect(() => commentBatchToMarkdownTransformer({ comments: [], flows: [] })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
