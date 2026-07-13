import {
  OperationItemStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { workItemsToQuestStatusTransformer } from './work-items-to-quest-status-transformer';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const STATUS_KEYS = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];

// Mirrors the transformer's preserved-status guards: pre-execution spec lifecycle
// (isPreExecution), explicit user pause (isUserPaused), deliberate abandon (terminal but not
// completed successfully), and explicit block (isQuestBlocked).
const PRESERVED_STATUSES = STATUS_KEYS.filter((status) => {
  const metadata = questStatusMetadataStatics.statuses[status];
  return (
    metadata.isPreExecution ||
    metadata.isUserPaused ||
    metadata.isQuestBlocked ||
    (metadata.isTerminal && !metadata.isCompletedSuccessfully)
  );
});

describe('workItemsToQuestStatusTransformer', () => {
  describe('preserved statuses (owned by something other than work-item state)', () => {
    it.each(PRESERVED_STATUSES)(
      'VALID: {currentStatus: %s, active item + pending operation} => unchanged',
      (status) => {
        const activeItem = WorkItemStub({
          id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
          status: 'in_progress',
        });

        const result = workItemsToQuestStatusTransformer({
          workItems: [activeItem],
          operations: [OperationItemStub({ status: 'pending' })],
          currentStatus: status,
        });

        expect(result).toBe(status);
      },
    );
  });

  describe('all work items terminal — ledger decides the outcome', () => {
    it('VALID: {all items complete, all operations complete} => complete', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item],
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            status: 'complete',
          }),
        ],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });

    it('VALID: {all items terminal, one operation still pending} => in_progress (no false complete between sessions)', () => {
      // The critical window: the last session's work item just went terminal but advance has
      // not created the next work item yet. Deriving `complete` here would terminalize the
      // quest and stop the scan before the relay advances.
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item],
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            status: 'complete',
          }),
          OperationItemStub({
            id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
            status: 'pending',
          }),
        ],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });

    it('VALID: {all items terminal, one operation in_progress} => in_progress', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item],
        operations: [OperationItemStub({ status: 'in_progress' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });

    it('VALID: {unresolved sink failure, ledger drained} => blocked', () => {
      const completeId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const completeItem = WorkItemStub({ id: completeId, status: 'complete' });
      const failedSink = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        status: 'failed',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, failedSink],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('blocked');
    });

    it('VALID: {sink failure, ledger still pending} => in_progress (recovery items still coming)', () => {
      // A failed ward work item whose operation chain continued (spiritmender + fresh ward
      // appended on the ledger) must not block — advance will create the next work item.
      const failedSink = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'failed',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedSink],
        operations: [OperationItemStub({ status: 'pending' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });

    it('VALID: {failed item superseded by a retry via insertedBy, ledger drained} => complete', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const retryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        status: 'complete',
        insertedBy: failedId,
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, retryItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });

    it('VALID: {failed item overtaken by a completed dependent, ledger drained} => complete', () => {
      // The failed item is depended on by a complete item, so it is NOT a sink — the pipeline
      // progressed past it and completion keys on the sink.
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const overtakingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        status: 'complete',
        dependsOn: [failedId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, overtakingItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });
  });

  describe('active work items', () => {
    it('VALID: {one item in_progress, ledger drained} => in_progress', () => {
      const activeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'in_progress',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [activeItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });
  });

  describe('only pending work items remain', () => {
    it('VALID: {every pending item dead-ended on a failed dep, ledger drained} => blocked', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const deadEndedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [failedId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, deadEndedItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('blocked');
    });

    it('VALID: {every pending item dead-ended on a failed dep, ledger still pending} => in_progress', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const deadEndedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [failedId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, deadEndedItem],
        operations: [OperationItemStub({ status: 'pending' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });

    it('VALID: {pending item with a satisfied complete dep, ledger drained} => in_progress', () => {
      const completeId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const completeItem = WorkItemStub({ id: completeId, status: 'complete' });
      const dispatchableItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, dispatchableItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });
  });

  describe('empty work items', () => {
    it('EMPTY: {workItems: [], operations: []} => complete (vacuous all-terminal, drained ledger)', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        operations: [],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });

    it('EMPTY: {workItems: [], one pending operation} => in_progress (advance will create the next item)', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        operations: [OperationItemStub({ status: 'pending' })],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });
  });

  describe('re-open a completed quest when live pending work is appended', () => {
    it('VALID: {currentStatus: "complete", pending item with satisfied deps appended} => in_progress', () => {
      // `complete` is deliberately NOT preserved — appending live work must re-open the quest
      // or loadActiveQuestsLayerBroker drops it and get-next-step never dispatches.
      const completeId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const completeItem = WorkItemStub({ id: completeId, status: 'complete' });
      const appendedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, appendedItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'complete',
      });

      expect(result).toBe('in_progress');
    });
  });
});
