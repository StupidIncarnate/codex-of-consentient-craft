import { QuestWorkItemIdStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemsToQuestStatusTransformer } from './work-items-to-quest-status-transformer';

describe('workItemsToQuestStatusTransformer', () => {
  describe('pre-execution statuses', () => {
    it('VALID: {currentStatus: "created"} => unchanged', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        currentStatus: 'created',
      });

      expect(result).toBe('created');
    });

    it('VALID: {currentStatus: "explore_flows"} => unchanged', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        currentStatus: 'explore_flows',
      });

      expect(result).toBe('explore_flows');
    });

    it('VALID: {currentStatus: "approved"} => unchanged', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        currentStatus: 'approved',
      });

      expect(result).toBe('approved');
    });

    it('VALID: {currentStatus: "design_approved"} => unchanged', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        currentStatus: 'design_approved',
      });

      expect(result).toBe('design_approved');
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

    it('VALID: {currentStatus: "seek_plan", empty workItems} => unchanged', () => {
      const result = workItemsToQuestStatusTransformer({
        workItems: [],
        currentStatus: 'seek_plan',
      });

      expect(result).toBe('seek_plan');
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
});
