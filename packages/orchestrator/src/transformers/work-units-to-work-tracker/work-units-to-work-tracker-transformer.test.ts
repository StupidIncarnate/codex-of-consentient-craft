import { FailCountStub } from '../../contracts/fail-count/fail-count.stub';
import { WorkItemIdStub } from '../../contracts/work-item-id/work-item-id.stub';
import { WorkUnitStub, CodeweaverWorkUnitStub } from '../../contracts/work-unit/work-unit.stub';
import { workUnitsToWorkTrackerTransformer } from './work-units-to-work-tracker-transformer';

describe('workUnitsToWorkTrackerTransformer', () => {
  describe('getReadyWorkIds()', () => {
    it('VALID: {2 work units} => returns both ids as pending', () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      const result = tracker.getReadyWorkIds();

      expect(result).toStrictEqual([
        WorkItemIdStub({ value: 'work-item-0' }),
        WorkItemIdStub({ value: 'work-item-1' }),
      ]);
    });

    it('EMPTY: {no work units} => returns empty array', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      const result = tracker.getReadyWorkIds();

      expect(result).toStrictEqual([]);
    });

    it('VALID: {1 work unit, started} => returns empty array', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });

      const result = tracker.getReadyWorkIds();

      expect(result).toStrictEqual([]);
    });
  });

  describe('getWorkUnit()', () => {
    it('VALID: {existing workItemId} => returns work unit', () => {
      const workUnit = WorkUnitStub();
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [workUnit] });

      const result = tracker.getWorkUnit({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });

      expect(result).toStrictEqual(workUnit);
    });

    it('ERROR: {nonexistent workItemId} => throws', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      expect(() =>
        tracker.getWorkUnit({ workItemId: WorkItemIdStub({ value: 'nonexistent' }) }),
      ).toThrow(/Work item not found: nonexistent/u);
    });
  });

  describe('markStarted()', () => {
    it('VALID: {pending item} => removes from ready ids', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });

      expect(tracker.getReadyWorkIds()).toStrictEqual([]);
    });

    it('ERROR: {nonexistent item} => throws', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      await expect(
        tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Work item not found/u);
    });
  });

  describe('markCompleted()', () => {
    it('VALID: {started item} => marks as completed', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markCompleted({ workItemId });

      expect(tracker.isAllComplete()).toBe(true);
      expect(tracker.getIncompleteIds()).toStrictEqual([]);
    });

    it('ERROR: {nonexistent item} => throws', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      await expect(
        tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Work item not found/u);
    });
  });

  describe('markFailed()', () => {
    it('VALID: {no retries configured} => marks as failed immediately', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markFailed({ workItemId });

      expect(tracker.getFailedIds()).toStrictEqual([workItemId]);
      expect(tracker.isAllComplete()).toBe(true);
    });

    it('VALID: {maxRetries: 1, first failure} => resets to pending for retry', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub()],
        maxRetries: FailCountStub({ value: 1 }),
      });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markFailed({ workItemId });

      expect(tracker.getReadyWorkIds()).toStrictEqual([workItemId]);
      expect(tracker.getFailedIds()).toStrictEqual([]);
    });

    it('VALID: {maxRetries: 1, second failure} => marks as failed', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub()],
        maxRetries: FailCountStub({ value: 1 }),
      });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markFailed({ workItemId });
      await tracker.markStarted({ workItemId });
      await tracker.markFailed({ workItemId });

      expect(tracker.getFailedIds()).toStrictEqual([workItemId]);
      expect(tracker.getReadyWorkIds()).toStrictEqual([]);
    });

    it('ERROR: {nonexistent item} => throws', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      await expect(
        tracker.markFailed({ workItemId: WorkItemIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Work item not found/u);
    });
  });

  describe('markPartiallyCompleted()', () => {
    it('VALID: {started item} => removes from ready and incomplete', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markPartiallyCompleted({ workItemId });

      expect(tracker.getReadyWorkIds()).toStrictEqual([]);
      expect(tracker.getIncompleteIds()).toStrictEqual([workItemId]);
      expect(tracker.isAllComplete()).toBe(false);
    });

    it('ERROR: {nonexistent item} => throws', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      await expect(
        tracker.markPartiallyCompleted({ workItemId: WorkItemIdStub({ value: 'nonexistent' }) }),
      ).rejects.toThrow(/Work item not found/u);
    });
  });

  describe('markBlocked()', () => {
    it('VALID: {started item} => marks as blocked', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markBlocked({ workItemId, targetRole: 'spiritmender' });

      expect(tracker.getReadyWorkIds()).toStrictEqual([]);
      expect(tracker.getIncompleteIds()).toStrictEqual([workItemId]);
    });

    it('ERROR: {nonexistent item} => throws', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      await expect(
        tracker.markBlocked({
          workItemId: WorkItemIdStub({ value: 'nonexistent' }),
          targetRole: 'spiritmender',
        }),
      ).rejects.toThrow(/Work item not found/u);
    });
  });

  describe('isAllComplete()', () => {
    it('EMPTY: {no items} => returns true', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      expect(tracker.isAllComplete()).toBe(true);
    });

    it('VALID: {all completed} => returns true', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markCompleted({ workItemId });

      expect(tracker.isAllComplete()).toBe(true);
    });

    it('VALID: {all failed} => returns true', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markFailed({ workItemId });

      expect(tracker.isAllComplete()).toBe(true);
    });

    it('VALID: {mix completed and failed} => returns true', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });
      await tracker.markFailed({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });

      expect(tracker.isAllComplete()).toBe(true);
    });

    it('VALID: {pending items remain} => returns false', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });

      expect(tracker.isAllComplete()).toBe(false);
    });
  });

  describe('getIncompleteIds()', () => {
    it('VALID: {2 items, 1 completed} => returns incomplete id', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });

      expect(tracker.getIncompleteIds()).toStrictEqual([WorkItemIdStub({ value: 'work-item-1' })]);
    });
  });

  describe('addWorkItem()', () => {
    it('VALID: {new work item} => adds to ready ids', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });
      const workItemId = WorkItemIdStub({ value: 'new-item' });
      const workUnit = WorkUnitStub();

      tracker.addWorkItem({ workItemId, workUnit });

      expect(tracker.getReadyWorkIds()).toStrictEqual([workItemId]);
      expect(tracker.getWorkUnit({ workItemId })).toStrictEqual(workUnit);
    });
  });
});
