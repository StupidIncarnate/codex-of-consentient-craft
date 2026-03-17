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
      expect(tracker.isAllComplete()).toBe(false);
      expect(tracker.isAllTerminal()).toBe(true);
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

    it('VALID: {all failed} => returns false', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markFailed({ workItemId });

      expect(tracker.isAllComplete()).toBe(false);
    });

    it('VALID: {mix completed and failed} => returns false', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });
      await tracker.markFailed({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });

      expect(tracker.isAllComplete()).toBe(false);
    });

    it('VALID: {pending items remain} => returns false', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });

      expect(tracker.isAllComplete()).toBe(false);
    });
  });

  describe('isAllTerminal()', () => {
    it('EMPTY: {no items} => returns true', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [] });

      expect(tracker.isAllTerminal()).toBe(true);
    });

    it('VALID: {all completed} => returns true', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markCompleted({ workItemId });

      expect(tracker.isAllTerminal()).toBe(true);
    });

    it('VALID: {all failed} => returns true', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });
      const workItemId = WorkItemIdStub({ value: 'work-item-0' });

      await tracker.markStarted({ workItemId });
      await tracker.markFailed({ workItemId });

      expect(tracker.isAllTerminal()).toBe(true);
    });

    it('VALID: {mix completed and failed} => returns true', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });
      await tracker.markFailed({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });

      expect(tracker.isAllTerminal()).toBe(true);
    });

    it('VALID: {pending items remain} => returns false', () => {
      const tracker = workUnitsToWorkTrackerTransformer({ workUnits: [WorkUnitStub()] });

      expect(tracker.isAllTerminal()).toBe(false);
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

  describe('skipAllPending()', () => {
    it('VALID: {2 pending items} => marks all as skipped', () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      tracker.skipAllPending();

      expect(tracker.getReadyWorkIds()).toStrictEqual([]);
      expect(tracker.isAllTerminal()).toBe(true);
      expect(tracker.getIncompleteIds()).toStrictEqual([]);
    });

    it('VALID: {1 started, 1 pending} => only skips pending item', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });

      tracker.skipAllPending();

      expect(tracker.getReadyWorkIds()).toStrictEqual([]);
      expect(tracker.isAllTerminal()).toBe(false);
      expect(tracker.getIncompleteIds()).toStrictEqual([WorkItemIdStub({ value: 'work-item-0' })]);
    });

    it('VALID: {1 completed, 1 failed, 1 pending} => only skips pending', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub(), WorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });
      await tracker.markFailed({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });

      tracker.skipAllPending();

      expect(tracker.getReadyWorkIds()).toStrictEqual([]);
      expect(tracker.isAllTerminal()).toBe(true);
      expect(tracker.getFailedIds()).toStrictEqual([WorkItemIdStub({ value: 'work-item-1' })]);
    });

    it('EMPTY: {no pending items} => no-op', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });

      tracker.skipAllPending();

      expect(tracker.isAllComplete()).toBe(true);
      expect(tracker.isAllTerminal()).toBe(true);
    });
  });

  describe('isAllTerminal() with skipped', () => {
    it('VALID: {all skipped} => returns true', () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      tracker.skipAllPending();

      expect(tracker.isAllTerminal()).toBe(true);
    });

    it('VALID: {mix of completed, failed, and skipped} => returns true', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub(), WorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });
      await tracker.markFailed({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });

      tracker.skipAllPending();

      expect(tracker.isAllTerminal()).toBe(true);
      expect(tracker.isAllComplete()).toBe(false);
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

    it('VALID: {add after skipAllPending} => newly added item is pending and ready', () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      tracker.skipAllPending();

      const newItemId = WorkItemIdStub({ value: 'recovery-item' });
      tracker.addWorkItem({ workItemId: newItemId, workUnit: WorkUnitStub() });

      expect(tracker.getReadyWorkIds()).toStrictEqual([newItemId]);
      expect(tracker.isAllTerminal()).toBe(false);
    });
  });

  describe('isAllComplete() with skipped items', () => {
    it('VALID: {completed + skipped} => returns false', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });

      tracker.skipAllPending();

      expect(tracker.isAllComplete()).toBe(false);
      expect(tracker.isAllTerminal()).toBe(true);
    });
  });

  describe('getFailedIds() with skipped items', () => {
    it('VALID: {failed + skipped} => returns only failed ids', async () => {
      const tracker = workUnitsToWorkTrackerTransformer({
        workUnits: [WorkUnitStub(), CodeweaverWorkUnitStub(), WorkUnitStub()],
      });

      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markFailed({ workItemId: WorkItemIdStub({ value: 'work-item-0' }) });
      await tracker.markStarted({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });
      await tracker.markCompleted({ workItemId: WorkItemIdStub({ value: 'work-item-1' }) });

      tracker.skipAllPending();

      expect(tracker.getFailedIds()).toStrictEqual([WorkItemIdStub({ value: 'work-item-0' })]);
      expect(tracker.isAllTerminal()).toBe(true);
    });
  });
});
