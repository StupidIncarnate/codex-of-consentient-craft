import { FlowIdStub, FlowStub } from '@dungeonmaster/shared/contracts';

import { operationFlowLabelsTransformer } from './operation-flow-labels-transformer';

describe('operationFlowLabelsTransformer', () => {
  describe('resolving names', () => {
    it('VALID: {one flowId matching a quest flow} => returns that flow name', () => {
      const flows = [
        FlowStub({ id: 'send-queued-comment-batch', name: 'Send queued comment batch' }),
      ];

      const result = operationFlowLabelsTransformer({
        flowIds: [FlowIdStub({ value: 'send-queued-comment-batch' })],
        flows,
      });

      expect(result.map((label) => String(label))).toStrictEqual(['Send queued comment batch']);
    });

    it('VALID: {two flowIds} => returns both names in the order the item lists them', () => {
      const flows = [
        FlowStub({ id: 'send-queued-comment-batch', name: 'Send queued comment batch' }),
        FlowStub({ id: 'view-persisted-comments', name: 'View persisted comments' }),
      ];

      const result = operationFlowLabelsTransformer({
        flowIds: [
          FlowIdStub({ value: 'view-persisted-comments' }),
          FlowIdStub({ value: 'send-queued-comment-batch' }),
        ],
        flows,
      });

      expect(result.map((label) => String(label))).toStrictEqual([
        'View persisted comments',
        'Send queued comment batch',
      ]);
    });
  });

  describe('drift', () => {
    it('EDGE: {flowId no longer on the quest} => falls back to the raw id so the drift stays visible', () => {
      const flows = [FlowStub({ id: 'view-persisted-comments', name: 'View persisted comments' })];

      const result = operationFlowLabelsTransformer({
        flowIds: [FlowIdStub({ value: 'deleted-flow' })],
        flows,
      });

      expect(result.map((label) => String(label))).toStrictEqual(['deleted-flow']);
    });

    it('EDGE: {quest has no flows at all} => every id falls back to itself', () => {
      const result = operationFlowLabelsTransformer({
        flowIds: [FlowIdStub({ value: 'send-queued-comment-batch' })],
        flows: [],
      });

      expect(result.map((label) => String(label))).toStrictEqual(['send-queued-comment-batch']);
    });
  });

  describe('empty', () => {
    it('EMPTY: {flowIds: []} => returns []', () => {
      const flows = [
        FlowStub({ id: 'send-queued-comment-batch', name: 'Send queued comment batch' }),
      ];

      const result = operationFlowLabelsTransformer({ flowIds: [], flows });

      expect(result).toStrictEqual([]);
    });
  });
});
