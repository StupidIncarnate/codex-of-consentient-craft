import { OperationItemStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { unclaimedOperationsTransformer } from './unclaimed-operations-transformer';

const OP_ID_1 = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d401';
const OP_ID_2 = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d402';
const OP_ID_3 = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d403';
const WORK_ITEM_ID_1 = 'a0000000-0000-4000-8000-000000000001';
const WORK_ITEM_ID_2 = 'a0000000-0000-4000-8000-000000000002';
const WARD_RESULT_ID = 'b0000000-0000-4000-8000-000000000001';

describe('unclaimedOperationsTransformer', () => {
  describe('claimed operations', () => {
    it('VALID: {operation claimed by a work item} => excludes it', () => {
      const claimed = OperationItemStub({ id: OP_ID_1, text: 'build the broker' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID_1,
        status: 'in_progress',
        relatedDataItems: [`operations/${OP_ID_1}`],
      });

      const result = unclaimedOperationsTransformer({
        operations: [claimed],
        workItems: [workItem],
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {operation claimed only by a skipped work item} => still excludes it', () => {
      const claimed = OperationItemStub({ id: OP_ID_1, text: 'build the broker' });
      const skippedWorkItem = WorkItemStub({
        id: WORK_ITEM_ID_1,
        status: 'skipped',
        relatedDataItems: [`operations/${OP_ID_1}`],
      });

      const result = unclaimedOperationsTransformer({
        operations: [claimed],
        workItems: [skippedWorkItem],
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('unclaimed operations', () => {
    it('VALID: {operation no work item references} => includes it', () => {
      const unclaimed = OperationItemStub({ id: OP_ID_2, text: 'wire the flow' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID_1,
        status: 'complete',
        relatedDataItems: [`operations/${OP_ID_1}`],
      });

      const result = unclaimedOperationsTransformer({
        operations: [OperationItemStub({ id: OP_ID_1, text: 'build the broker' }), unclaimed],
        workItems: [workItem],
      });

      expect(result).toStrictEqual([unclaimed]);
    });

    it('VALID: {three operations, the middle one claimed} => returns the other two in operations order', () => {
      const first = OperationItemStub({ id: OP_ID_1, text: 'build the broker' });
      const claimed = OperationItemStub({ id: OP_ID_2, text: 'wire the flow' });
      const last = OperationItemStub({ id: OP_ID_3, role: 'ward', text: 'verify: ward' });
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID_1,
        status: 'in_progress',
        relatedDataItems: [`operations/${OP_ID_2}`],
      });

      const result = unclaimedOperationsTransformer({
        operations: [first, claimed, last],
        workItems: [workItem],
      });

      expect(result).toStrictEqual([first, last]);
    });

    it('VALID: {work item carrying only a wardResults ref} => claims nothing, so every operation is returned', () => {
      const first = OperationItemStub({ id: OP_ID_1, text: 'build the broker' });
      const second = OperationItemStub({ id: OP_ID_2, text: 'wire the flow' });
      const wardWorkItem = WorkItemStub({
        id: WORK_ITEM_ID_2,
        role: 'ward',
        status: 'failed',
        relatedDataItems: [`wardResults/${WARD_RESULT_ID}`],
      });

      const result = unclaimedOperationsTransformer({
        operations: [first, second],
        workItems: [wardWorkItem],
      });

      expect(result).toStrictEqual([first, second]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {no operations} => returns an empty list', () => {
      const workItem = WorkItemStub({
        id: WORK_ITEM_ID_1,
        status: 'complete',
        relatedDataItems: [`operations/${OP_ID_1}`],
      });

      const result = unclaimedOperationsTransformer({ operations: [], workItems: [workItem] });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {no work items} => returns every operation in operations order', () => {
      const first = OperationItemStub({ id: OP_ID_1, text: 'build the broker' });
      const second = OperationItemStub({ id: OP_ID_2, text: 'wire the flow' });

      const result = unclaimedOperationsTransformer({
        operations: [first, second],
        workItems: [],
      });

      expect(result).toStrictEqual([first, second]);
    });
  });
});
