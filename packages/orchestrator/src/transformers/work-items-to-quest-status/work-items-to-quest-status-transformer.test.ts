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
// completed successfully), explicit block (isQuestBlocked), and a completed merge. `merged` is
// terminal AND completedSuccessfully — the same combination `complete` carries — so no metadata
// flag distinguishes it; the transformer preserves it via a plain literal comparison, and this
// derivation adds the matching literal check rather than a flag.
const PRESERVED_STATUSES = STATUS_KEYS.filter((status) => {
  const metadata = questStatusMetadataStatics.statuses[status];
  return (
    metadata.isPreExecution ||
    metadata.isUserPaused ||
    metadata.isQuestBlocked ||
    (metadata.isTerminal && !metadata.isCompletedSuccessfully) ||
    status === 'merged'
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

  describe('currentStatus: merging — outcomes map to merging/merged, not in_progress/complete', () => {
    it('VALID: {currentStatus: "merging", warpgate item in_progress, operation in_progress} => merging', () => {
      const activeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'warpgate',
        status: 'in_progress',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [activeItem],
        operations: [OperationItemStub({ role: 'warpgate', status: 'in_progress' })],
        currentStatus: 'merging',
      });

      expect(result).toBe('merging');
    });

    it('VALID: {currentStatus: "merging", all items terminal, ledger drained} => merged', () => {
      const mergedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'warpgate',
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [mergedItem],
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            role: 'warpgate',
            status: 'complete',
          }),
        ],
        currentStatus: 'merging',
      });

      expect(result).toBe('merged');
    });

    it('VALID: {currentStatus: "merging", all items terminal, one operation still pending} => merging (advance window)', () => {
      const mergedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'warpgate',
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [mergedItem],
        operations: [
          OperationItemStub({
            id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
            role: 'warpgate',
            status: 'complete',
          }),
          OperationItemStub({
            id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
            role: 'warpgate',
            status: 'pending',
          }),
        ],
        currentStatus: 'merging',
      });

      expect(result).toBe('merging');
    });

    it('VALID: {currentStatus: "merging", unresolved sink failure, ledger drained} => blocked (a failed merge still blocks)', () => {
      const completeId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const completeItem = WorkItemStub({ id: completeId, role: 'warpgate', status: 'complete' });
      const failedSink = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        role: 'warpgate',
        status: 'failed',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, failedSink],
        operations: [OperationItemStub({ role: 'warpgate', status: 'complete' })],
        currentStatus: 'merging',
      });

      expect(result).toBe('blocked');
    });

    // Regression guard: a quest that was `blocked` when the user pressed Merge still carries the
    // failed sink work item that blocked it. That failure is precisely what the user chose to merge
    // past, so it must not pin the quest short of `merged` — only a failed `warpgate` item does.
    it("VALID: {currentStatus: 'merging', a failed sink work item from the earlier block, warpgate item complete, all operations complete} => merged", () => {
      const failedSinkId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedSink = WorkItemStub({ id: failedSinkId, status: 'failed' });
      const warpgateItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        role: 'warpgate',
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedSink, warpgateItem],
        operations: [OperationItemStub({ role: 'warpgate', status: 'complete' })],
        currentStatus: 'merging',
      });

      expect(result).toBe('merged');
    });

    // Pins that the sink-failure-blocks behaviour is untouched OUTSIDE `merging` — the narrowing is
    // scoped to the one status a merge runs at, not a blanket exemption for every sink failure.
    it("VALID: {currentStatus: 'in_progress', unresolved sink failure, all operations complete} => blocked", () => {
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

    it('VALID: {currentStatus: "complete", pending tavernkeeper item appended} => complete (follow-up chat does not re-open a finished quest)', () => {
      const completeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });
      const tavernkeeperItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        role: 'tavernkeeper',
        status: 'pending',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, tavernkeeperItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'complete',
      });

      expect(result).toBe('complete');
    });

    it('VALID: {currentStatus: "complete", pending warpgate item appended} => in_progress (a merge is real dispatched work, so the exclusion is scoped not blanket)', () => {
      const completeId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const completeItem = WorkItemStub({ id: completeId, status: 'complete' });
      const warpgateItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        role: 'warpgate',
        status: 'pending',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, warpgateItem],
        operations: [OperationItemStub({ status: 'complete' })],
        currentStatus: 'complete',
      });

      expect(result).toBe('in_progress');
    });

    it('VALID: {currentStatus: "merged", pending tavernkeeper item appended} => merged (never derived away from)', () => {
      const mergedWorkItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'warpgate',
        status: 'complete',
      });
      const tavernkeeperItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' }),
        role: 'tavernkeeper',
        status: 'pending',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [mergedWorkItem, tavernkeeperItem],
        operations: [OperationItemStub({ role: 'warpgate', status: 'complete' })],
        currentStatus: 'merged',
      });

      expect(result).toBe('merged');
    });
  });
});
