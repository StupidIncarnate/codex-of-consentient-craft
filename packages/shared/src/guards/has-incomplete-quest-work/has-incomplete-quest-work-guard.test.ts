import { OperationItemStub } from '../../contracts/operation-item/operation-item.stub';
import { WorkItemStub } from '../../contracts/work-item/work-item.stub';
import { workItemStatusMetadataStatics } from '../../statics/work-item-status-metadata/work-item-status-metadata-statics';
import { hasIncompleteQuestWorkGuard } from './has-incomplete-quest-work-guard';

type StatusKey = keyof typeof workItemStatusMetadataStatics.statuses;

const WORK_ITEM_STATUSES = Object.keys(
  workItemStatusMetadataStatics.statuses,
) as readonly StatusKey[];

const TERMINAL_STATUSES = new Set(
  WORK_ITEM_STATUSES.filter((status) => workItemStatusMetadataStatics.statuses[status].isTerminal),
);

const DRAINED_LEDGER = [OperationItemStub({ status: 'complete' })];

describe('hasIncompleteQuestWorkGuard', () => {
  describe('work-item half', () => {
    it.each(WORK_ITEM_STATUSES)(
      'VALID: {workItem status: %s, ledger drained} => true only while that item is non-terminal',
      (status) => {
        const result = hasIncompleteQuestWorkGuard({
          workItems: [WorkItemStub({ status })],
          operations: DRAINED_LEDGER,
        });

        expect(result).toBe(!TERMINAL_STATUSES.has(status));
      },
    );
  });

  describe('ledger half', () => {
    it('VALID: {every work item terminal, one pending operation} => true (advance has not minted it yet)', () => {
      const result = hasIncompleteQuestWorkGuard({
        workItems: [WorkItemStub({ status: 'complete' })],
        operations: [OperationItemStub({ status: 'pending' })],
      });

      expect(result).toBe(true);
    });

    it('VALID: {every work item terminal, one in_progress operation} => true', () => {
      const result = hasIncompleteQuestWorkGuard({
        workItems: [WorkItemStub({ status: 'complete' })],
        operations: [OperationItemStub({ status: 'in_progress' })],
      });

      expect(result).toBe(true);
    });

    it('VALID: {every work item terminal, ledger drained} => false — nothing left to dispatch', () => {
      const result = hasIncompleteQuestWorkGuard({
        workItems: [WorkItemStub({ status: 'complete' })],
        operations: DRAINED_LEDGER,
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {workItems: [], operations: []} => false — a bare quest has nothing to dispatch', () => {
      const result = hasIncompleteQuestWorkGuard({ workItems: [], operations: [] });

      expect(result).toBe(false);
    });

    it('EMPTY: {no arguments} => false', () => {
      const result = hasIncompleteQuestWorkGuard({});

      expect(result).toBe(false);
    });
  });
});
