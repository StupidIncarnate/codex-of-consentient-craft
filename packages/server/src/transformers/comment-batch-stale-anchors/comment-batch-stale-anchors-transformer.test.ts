import {
  CommentBatchEntryStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { commentBatchStaleAnchorsTransformer } from './comment-batch-stale-anchors-transformer';

describe('commentBatchStaleAnchorsTransformer', () => {
  describe('node-anchored comment resolves', () => {
    it('VALID: {comment anchored to existing flow+node} => returns []', () => {
      const node = FlowNodeStub({ id: 'start', label: 'Start' });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const comment = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
      });

      const result = commentBatchStaleAnchorsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('observable-anchored comment resolves', () => {
    it('VALID: {comment anchored to existing flow+node+observable} => returns []', () => {
      const observable = FlowObservableStub({ id: 'obs-1' });
      const node = FlowNodeStub({
        id: 'start',
        label: 'Start',
        observables: [observable],
      });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const comment = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
        observableId: 'obs-1',
      });

      const result = commentBatchStaleAnchorsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('flow id missing', () => {
    it('EDGE: {comment flowId absent from quest.flows} => returns the offending anchor', () => {
      const otherFlow = FlowStub({
        id: 'signup-flow',
        nodes: [FlowNodeStub({ id: 'start', label: 'Start' })],
      });
      const comment = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
      });

      const result = commentBatchStaleAnchorsTransformer({
        comments: [comment],
        flows: [otherFlow],
      });

      expect(result).toStrictEqual([{ flowId: comment.flowId, nodeId: comment.nodeId }]);
    });
  });

  describe('node id missing within an existing flow', () => {
    it('EDGE: {comment nodeId absent from its flow nodes} => returns the offending anchor', () => {
      const flow = FlowStub({ id: 'login-flow', nodes: [] });
      const comment = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
      });

      const result = commentBatchStaleAnchorsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([{ flowId: comment.flowId, nodeId: comment.nodeId }]);
    });
  });

  describe('observableId missing on an existing node', () => {
    it('EDGE: {observable comment whose node survives but observable was deleted} => returns the offending anchor with observableId', () => {
      const node = FlowNodeStub({ id: 'start', label: 'Start', observables: [] });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const comment = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
        observableId: 'obs-1',
      });

      const result = commentBatchStaleAnchorsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([
        { flowId: comment.flowId, nodeId: comment.nodeId, observableId: comment.observableId },
      ]);
    });
  });

  describe('mixed batch', () => {
    it('EDGE: {3 comments, 1 stale anchor} => returns exactly the one stale anchor', () => {
      const node = FlowNodeStub({ id: 'start', label: 'Start' });
      const flow = FlowStub({ id: 'login-flow', nodes: [node] });
      const validFirst = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
      });
      const stale = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'deleted-node',
      });
      const validSecond = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
      });

      const result = commentBatchStaleAnchorsTransformer({
        comments: [validFirst, stale, validSecond],
        flows: [flow],
      });

      expect(result).toStrictEqual([{ flowId: stale.flowId, nodeId: stale.nodeId }]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {comments: []} => returns []', () => {
      const flow = FlowStub({});

      const result = commentBatchStaleAnchorsTransformer({ comments: [], flows: [flow] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {flows: []} => returns an offending anchor for every posted comment', () => {
      const commentOne = CommentBatchEntryStub({
        flowId: 'login-flow',
        nodeId: 'start',
      });
      const commentTwo = CommentBatchEntryStub({
        flowId: 'signup-flow',
        nodeId: 'end',
      });

      const result = commentBatchStaleAnchorsTransformer({
        comments: [commentOne, commentTwo],
        flows: [],
      });

      expect(result).toStrictEqual([
        { flowId: commentOne.flowId, nodeId: commentOne.nodeId },
        { flowId: commentTwo.flowId, nodeId: commentTwo.nodeId },
      ]);
    });
  });
});
