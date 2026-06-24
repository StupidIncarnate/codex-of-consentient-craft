import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { workItemsToQuestStatusTransformer } from './work-items-to-quest-status-transformer';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const PRE_EXECUTION_STATUSES = (
  Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[]
).filter((s) => questStatusMetadataStatics.statuses[s].isPreExecution);

describe('workItemsToQuestStatusTransformer', () => {
  describe('pre-execution statuses', () => {
    it.each(PRE_EXECUTION_STATUSES)('VALID: {currentStatus: %s} => unchanged', (status) => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        currentStatus: status,
      });

      expect(result).toBe(status);
    });
  });

  describe('seek_* statuses (PathSeeker phased)', () => {
    it('VALID: {currentStatus: "seek_scope", mixed workItems} => unchanged', () => {
      const item1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });
      const item2 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'in_progress',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item1, item2],
        currentStatus: 'seek_scope',
      });

      expect(result).toBe('seek_scope');
    });

    it('VALID: {currentStatus: "seek_synth", all items complete} => unchanged', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item],
        currentStatus: 'seek_synth',
      });

      expect(result).toBe('seek_synth');
    });

    it('VALID: {currentStatus: "seek_walk", pending items with failed deps} => unchanged', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const pendingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [failedId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, pendingItem],
        currentStatus: 'seek_walk',
      });

      expect(result).toBe('seek_walk');
    });
  });

  describe('complete status', () => {
    it('VALID: {all items complete} => complete', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });
  });

  describe('in_progress status', () => {
    it('VALID: {some items in_progress} => in_progress', () => {
      const item1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'in_progress',
      });
      const item2 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [item1.id],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item1, item2],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });
  });

  describe('blocked status', () => {
    it('VALID: {pending items with failed deps} => blocked', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const pendingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [failedId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, pendingItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('blocked');
    });
  });

  describe('skipped items', () => {
    it('VALID: {all items complete or skipped} => complete', () => {
      const item1 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });
      const item2 = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'skipped',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item1, item2],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });

    it('VALID: {all items skipped} => complete', () => {
      const item = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'skipped',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [item],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });

    it('VALID: {skipped + failed + pending depending on failed} => blocked', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const skippedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'skipped',
      });
      const pendingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' }),
        status: 'pending',
        dependsOn: [failedId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, skippedItem, pendingItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('blocked');
    });
  });

  describe('drain+skip recovery (non-pathseeker failure)', () => {
    it('VALID: {failed + skipped + in_progress recovery} => in_progress (not blocked)', () => {
      const failedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'failed',
      });
      const skippedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'skipped',
      });
      const recoveryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' }),
        status: 'in_progress',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, skippedItem, recoveryItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });

    it('VALID: {failed + skipped + pending recovery with no deps} => in_progress (not blocked)', () => {
      const failedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'failed',
      });
      const skippedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'skipped',
      });
      const recoveryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' }),
        status: 'pending',
        dependsOn: [],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, skippedItem, recoveryItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });
  });

  describe('pathseeker terminal failure', () => {
    it('VALID: {pathseeker failed + pending items depending on it} => blocked', () => {
      const pathseekerId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const pathseekerItem = WorkItemStub({ id: pathseekerId, status: 'failed' });
      const pendingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [pathseekerId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [pathseekerItem, pendingItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('blocked');
    });
  });

  describe('recovery via insertedBy (failed item superseded by a retry)', () => {
    it('VALID: {all complete except one failed item that is superseded by a complete retry} => complete', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      // The failed item (e.g. ward failed)
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      // The retry item spliced in recovery — insertedBy === failedItem.id
      const retryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'complete',
        insertedBy: failedId,
      });
      // All other items are complete
      const codeweaverItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f' }),
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [codeweaverItem, failedItem, retryItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });

    it('VALID: {all terminal, failed item with NO superseding retry, no pending} => blocked', () => {
      const failedId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const failedItem = WorkItemStub({ id: failedId, status: 'failed' });
      const completeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'complete',
        // insertedBy is NOT set — this item was not a retry for failedItem
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedItem, completeItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('blocked');
    });
  });

  describe('sink-based completion (failed item overtaken by completed dependents)', () => {
    it('VALID: {all terminal, sink complete, earlier failed item whose dependents all completed} => complete', () => {
      // Mirrors quest 520b526b: an early ward (failedWardId) failed, but the flowriders that
      // depended on it all completed (the pipeline progressed past it), and the terminal sink
      // ward (sinkId — nothing depends on it) is complete. No item carries
      // insertedBy === failedWardId. Completion keys on the sink, so the failed-but-overtaken
      // item must NOT force `blocked`.
      const failedWardId = QuestWorkItemIdStub({
        value: '7bc1aeef-0000-4000-8000-000000000001',
      });
      const failedWard = WorkItemStub({ id: failedWardId, status: 'failed' });
      // The flowrider that depended on the failed ward — it completed anyway.
      const flowriderId = QuestWorkItemIdStub({
        value: '7bc1aeef-0000-4000-8000-000000000002',
      });
      const flowrider = WorkItemStub({
        id: flowriderId,
        status: 'complete',
        dependsOn: [failedWardId],
      });
      // The terminal sink ward — nothing depends on it — completed.
      const sinkId = QuestWorkItemIdStub({
        value: '31991369-0000-4000-8000-000000000003',
      });
      const sinkWard = WorkItemStub({
        id: sinkId,
        status: 'complete',
        dependsOn: [flowriderId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [failedWard, flowrider, sinkWard],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });

    it('VALID: {all terminal, sink work item itself failed} => blocked', () => {
      // When the sink work item (nothing depends on it) is the failure, completion cannot be
      // declared — the quest derives `blocked` so recovery can splice an ad-hoc retry.
      const completeId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const completeItem = WorkItemStub({ id: completeId, status: 'complete' });
      const sinkId = QuestWorkItemIdStub({
        value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
      });
      const failedSink = WorkItemStub({
        id: sinkId,
        status: 'failed',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, failedSink],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('blocked');
    });
  });

  describe('abandoned quest is held by explicit user intent', () => {
    it('VALID: {currentStatus: "abandoned", all items terminal} => stays abandoned (not re-derived to complete)', () => {
      // Abandon is a deliberate terminal decision. Even though every item is terminal (which would
      // otherwise derive `complete`), work-item state must never override the abandon.
      const skippedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'skipped',
      });
      const completeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'complete',
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [skippedItem, completeItem],
        currentStatus: 'abandoned',
      });

      expect(result).toBe('abandoned');
    });
  });

  describe('keep current status', () => {
    it('VALID: {mix of complete and pending with valid deps} => keep current', () => {
      const completeId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const completeItem = WorkItemStub({ id: completeId, status: 'complete' });
      const pendingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, pendingItem],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('in_progress');
    });
  });

  describe('re-open a completed quest when live pending work is appended', () => {
    it('VALID: {currentStatus: "complete", complete item + newly appended pending codeweaver with satisfied deps} => in_progress', () => {
      // Regression for the post-walk hook hole: the last pathseeker completing leaves every item
      // terminal so the quest derives `complete`; the hook then appends the pending codeweaver
      // chain. The derivation must re-open the quest to in_progress, not preserve `complete`,
      // otherwise loadActiveQuestsLayerBroker drops it and get-next-step never dispatches.
      const walkId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const walkItem = WorkItemStub({ id: walkId, status: 'complete' });
      const codeweaverItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [walkId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [walkItem, codeweaverItem],
        currentStatus: 'complete',
      });

      expect(result).toBe('in_progress');
    });
  });

  describe('user-paused quest is held by explicit user intent', () => {
    it('VALID: {currentStatus: "paused", pending item with satisfied deps} => stays paused (not re-derived to in_progress)', () => {
      const completeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const completeItem = WorkItemStub({ id: completeId, status: 'complete' });
      const pendingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        status: 'pending',
        dependsOn: [completeId],
      });

      const result = workItemsToQuestStatusTransformer({
        workItems: [completeItem, pendingItem],
        currentStatus: 'paused',
      });

      expect(result).toBe('paused');
    });
  });

  describe('empty work items list with execution status', () => {
    it('EDGE: {workItems: [], currentStatus: "in_progress"} => complete (vacuous all-terminal)', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        currentStatus: 'in_progress',
      });

      expect(result).toBe('complete');
    });
  });
});
