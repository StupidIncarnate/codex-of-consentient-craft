import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestCommentStub,
} from '@dungeonmaster/shared/contracts';

import { questResolvedCommentsTransformer } from './quest-resolved-comments-transformer';

describe('questResolvedCommentsTransformer', () => {
  describe('node-anchored comments', () => {
    it('VALID: {comment anchored to existing flow+node} => returns the comment', () => {
      const node = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const comment = QuestCommentStub({});

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([comment]);
    });

    it('EDGE: {comment anchored to a node deleted from its flow} => drops the comment', () => {
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [] });
      const comment = QuestCommentStub({});

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {comment anchored to a flow that was deleted entirely} => drops the comment', () => {
      const comment = QuestCommentStub({});

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {comment nodeId matches a node id existing only in a different flow} => drops the comment', () => {
      const otherFlowNode = FlowNodeStub({ id: 'start' as never, label: 'Start' as never });
      const otherFlow = FlowStub({ id: 'signup-flow' as never, nodes: [otherFlowNode] });
      const loginFlow = FlowStub({ id: 'login-flow' as never, nodes: [] });
      const comment = QuestCommentStub({});

      const result = questResolvedCommentsTransformer({
        comments: [comment],
        flows: [loginFlow, otherFlow],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('observable-anchored comments', () => {
    it('VALID: {comment anchored to existing flow+node+observable} => returns the comment', () => {
      const observable = FlowObservableStub({ id: 'obs-1' as never });
      const node = FlowNodeStub({
        id: 'start' as never,
        label: 'Start' as never,
        observables: [observable],
      });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const comment = QuestCommentStub({ observableId: 'obs-1' as never });

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([comment]);
    });

    it('EDGE: {comment observableId deleted but its parent node survives} => drops the comment', () => {
      const node = FlowNodeStub({ id: 'start' as never, label: 'Start' as never, observables: [] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const comment = QuestCommentStub({ observableId: 'obs-1' as never });

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([]);
    });

    it('EDGE: {one observable deleted, node keeps a plain node-anchored comment} => drops only the observable-anchored comment', () => {
      const survivingObservable = FlowObservableStub({ id: 'obs-2' as never });
      const node = FlowNodeStub({
        id: 'start' as never,
        label: 'Start' as never,
        observables: [survivingObservable],
      });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const orphanedObservableComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        observableId: 'obs-1' as never,
      });
      const nodeAnchoredComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002' as never,
      });
      const survivingObservableComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d003' as never,
        observableId: 'obs-2' as never,
      });

      const result = questResolvedCommentsTransformer({
        comments: [orphanedObservableComment, nodeAnchoredComment, survivingObservableComment],
        flows: [flow],
      });

      expect(result).toStrictEqual([nodeAnchoredComment, survivingObservableComment]);
    });

    it('EDGE: {comment anchored to a node that was deleted, taking its observable along} => drops the comment', () => {
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [] });
      const comment = QuestCommentStub({ observableId: 'obs-1' as never });

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([]);
    });
  });

  // Two flows carrying the SAME node id, each with its own (different) observable set — flowId is
  // the only thing that discriminates which flow's node the comment actually belongs to. A
  // transformer that resolves by node id alone (ignoring which flow map it came from) either
  // wrongly keeps a comment via a same-id node in the WRONG flow, or wrongly drops one whose own
  // flow simply isn't first in iteration order.
  describe('cross-flow node id collision (flow-scoped, not first-match)', () => {
    it('EDGE: {two flows share a node id; comment targets the second flow but names the FIRST flow’s observable id} => drops the comment', () => {
      const alphaObservable = FlowObservableStub({ id: 'shared-obs' as never });
      const alphaNode = FlowNodeStub({
        id: 'shared-node' as never,
        label: 'Shared Node' as never,
        observables: [alphaObservable],
      });
      const alphaFlow = FlowStub({ id: 'ocl-alpha' as never, nodes: [alphaNode] });

      const betaObservable = FlowObservableStub({ id: 'second-obs' as never });
      const betaNode = FlowNodeStub({
        id: 'shared-node' as never,
        label: 'Shared Node' as never,
        observables: [betaObservable],
      });
      const betaFlow = FlowStub({
        id: 'ocl-beta' as never,
        name: 'Beta Flow' as never,
        nodes: [betaNode],
      });

      // comment.flowId is ocl-beta, but observableId 'shared-obs' only exists on ocl-alpha's copy
      // of shared-node — ocl-beta's copy only carries 'second-obs'.
      const comment = QuestCommentStub({
        flowId: 'ocl-beta' as never,
        nodeId: 'shared-node' as never,
        observableId: 'shared-obs' as never,
      });

      const result = questResolvedCommentsTransformer({
        comments: [comment],
        flows: [alphaFlow, betaFlow],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {two flows share a node id; comment’s own flow is NOT first in the flows array} => keeps the comment', () => {
      const alphaObservable = FlowObservableStub({ id: 'shared-obs' as never });
      const alphaNode = FlowNodeStub({
        id: 'shared-node' as never,
        label: 'Shared Node' as never,
        observables: [alphaObservable],
      });
      const alphaFlow = FlowStub({ id: 'ocl-alpha' as never, nodes: [alphaNode] });

      const betaObservable = FlowObservableStub({ id: 'second-obs' as never });
      const betaNode = FlowNodeStub({
        id: 'shared-node' as never,
        label: 'Shared Node' as never,
        observables: [betaObservable],
      });
      const betaFlow = FlowStub({
        id: 'ocl-beta' as never,
        name: 'Beta Flow' as never,
        nodes: [betaNode],
      });

      // ocl-beta is listed FIRST here; the comment belongs to ocl-alpha (second in the array) and
      // names alpha's own observable — resolution must key on comment.flowId, not array position.
      const comment = QuestCommentStub({
        flowId: 'ocl-alpha' as never,
        nodeId: 'shared-node' as never,
        observableId: 'shared-obs' as never,
      });

      const result = questResolvedCommentsTransformer({
        comments: [comment],
        flows: [betaFlow, alphaFlow],
      });

      expect(result).toStrictEqual([comment]);
    });
  });

  describe('label rename', () => {
    it('VALID: {node label renamed, id unchanged} => comment survives with unchanged text and createdAt', () => {
      const node = FlowNodeStub({ id: 'start' as never, label: 'Renamed Start' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const comment = QuestCommentStub({});

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([comment]);
    });
  });

  describe('sibling node isolation', () => {
    it('VALID: {sibling node deleted from same flow} => comment anchored to the surviving node is untouched', () => {
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'end' as never, label: 'End' as never })],
      });
      const comment = QuestCommentStub({ nodeId: 'end' as never });

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [flow] });

      expect(result).toStrictEqual([comment]);
    });
  });

  describe('ordering', () => {
    it('EDGE: {mixed keep/drop comments} => returns kept comments in original relative order', () => {
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'start' as never, label: 'Start' as never })],
      });
      const keepFirst = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        nodeId: 'start' as never,
      });
      const drop = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002' as never,
        nodeId: 'deleted-node' as never,
      });
      const keepSecond = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d003' as never,
        nodeId: 'start' as never,
      });

      const result = questResolvedCommentsTransformer({
        comments: [keepFirst, drop, keepSecond],
        flows: [flow],
      });

      expect(result).toStrictEqual([keepFirst, keepSecond]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {comments: []} => returns []', () => {
      const flow = FlowStub({});

      const result = questResolvedCommentsTransformer({ comments: [], flows: [flow] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {flows: []} => returns []', () => {
      const comment = QuestCommentStub({});

      const result = questResolvedCommentsTransformer({ comments: [comment], flows: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
