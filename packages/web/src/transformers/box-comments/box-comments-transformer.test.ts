import {
  FlowIdStub,
  FlowNodeIdStub,
  ObservableIdStub,
  QuestCommentStub,
} from '@dungeonmaster/shared/contracts';

import { boxCommentsTransformer } from './box-comments-transformer';

const FLOW_ID = FlowIdStub({ value: 'login-flow' });
const OTHER_FLOW_ID = FlowIdStub({ value: 'signup-flow' });
const NODE_ID = FlowNodeIdStub({ value: 'start' });
const OTHER_NODE_ID = FlowNodeIdStub({ value: 'end' });
const OBSERVABLE_ID = ObservableIdStub({ value: 'login-redirects-to-dashboard' });
const OTHER_OBSERVABLE_ID = ObservableIdStub({ value: 'login-shows-error' });

describe('boxCommentsTransformer', () => {
  it('EMPTY: {comments: []} => returns empty array (#check-no-badge-zero-comments)', () => {
    const result = boxCommentsTransformer({ comments: [], flowId: FLOW_ID, nodeId: NODE_ID });

    expect(result).toStrictEqual([]);
  });

  it('EMPTY: {comments: [one comment on a different node]} => returns empty array', () => {
    const comment = QuestCommentStub({ flowId: FLOW_ID, nodeId: OTHER_NODE_ID });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {comment on the queried flowId + nodeId, no observableId on either side} => returns the comment', () => {
    const comment = QuestCommentStub({ flowId: FLOW_ID, nodeId: NODE_ID });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(result).toStrictEqual([comment]);
  });

  it('VALID: {comment anchored to the queried observableId} => returns the comment (#check-observable-card-shows-its-own-comments)', () => {
    const comment = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      observableId: OBSERVABLE_ID,
    });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      observableId: OBSERVABLE_ID,
    });

    expect(result).toStrictEqual([comment]);
  });

  it('EDGE: {comment anchored to an observable, queried with no observableId} => excludes the comment (#check-node-panel-excludes-observable-comments)', () => {
    const comment = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      observableId: OBSERVABLE_ID,
    });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {comment anchored to the node only, queried with an observableId} => excludes the comment', () => {
    const comment = QuestCommentStub({ flowId: FLOW_ID, nodeId: NODE_ID });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      observableId: OBSERVABLE_ID,
    });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {comment anchored to a different observableId on the same node} => excludes the comment', () => {
    const comment = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      observableId: OTHER_OBSERVABLE_ID,
    });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      observableId: OBSERVABLE_ID,
    });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {comment on a different flowId, same nodeId} => excludes the comment', () => {
    const comment = QuestCommentStub({ flowId: OTHER_FLOW_ID, nodeId: NODE_ID });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(result).toStrictEqual([]);
  });

  it('EDGE: {comment on a different nodeId, same flowId} => excludes the comment', () => {
    const comment = QuestCommentStub({ flowId: FLOW_ID, nodeId: OTHER_NODE_ID });

    const result = boxCommentsTransformer({
      comments: [comment],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(result).toStrictEqual([]);
  });

  it('VALID: {three comments at different createdAt timestamps} => returns them newest first (#check-newest-first-order)', () => {
    const oldest = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'oldest',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    const middle = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'middle',
      createdAt: '2024-06-01T00:00:00.000Z',
    });
    const newest = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'newest',
      createdAt: '2024-12-01T00:00:00.000Z',
    });

    const result = boxCommentsTransformer({
      comments: [oldest, newest, middle],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(result).toStrictEqual([newest, middle, oldest]);
  });

  it('VALID: {two comments with identical text on the same box} => returns both, not deduplicated by content', () => {
    const first = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'looks wrong',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    const second = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'looks wrong',
      createdAt: '2024-06-01T00:00:00.000Z',
    });

    const result = boxCommentsTransformer({
      comments: [first, second],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(result).toStrictEqual([second, first]);
  });

  // #check-newest-first-order's tie case: the comparator returns 0 for equal createdAt, which only
  // yields a deterministic order because Array.prototype.sort is a STABLE sort — it preserves each
  // call's own input order on a tie. Running the same two comments in both input orders and getting
  // each one's own order back (never one fixed order regardless of input) is what proves that.
  it('EDGE: {two comments sharing the exact same createdAt} => keeps them in the order they were given, not a fixed order regardless of input', () => {
    const first = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'first arrival',
      createdAt: '2024-06-01T00:00:00.000Z',
    });
    const second = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'second arrival',
      createdAt: '2024-06-01T00:00:00.000Z',
    });

    const resultForwardInput = boxCommentsTransformer({
      comments: [first, second],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });
    const resultReversedInput = boxCommentsTransformer({
      comments: [second, first],
      flowId: FLOW_ID,
      nodeId: NODE_ID,
    });

    expect(resultForwardInput).toStrictEqual([first, second]);
    expect(resultReversedInput).toStrictEqual([second, first]);
  });

  it('EDGE: {input comments array} => is not mutated by the transformer', () => {
    const first = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'first',
      createdAt: '2024-01-01T00:00:00.000Z',
    });
    const second = QuestCommentStub({
      flowId: FLOW_ID,
      nodeId: NODE_ID,
      text: 'second',
      createdAt: '2024-06-01T00:00:00.000Z',
    });
    const input = [first, second];

    boxCommentsTransformer({ comments: input, flowId: FLOW_ID, nodeId: NODE_ID });

    expect(input).toStrictEqual([first, second]);
  });
});
