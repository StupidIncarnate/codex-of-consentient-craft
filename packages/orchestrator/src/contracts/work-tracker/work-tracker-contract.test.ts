import { workTrackerContract } from './work-tracker-contract';
import { WorkTrackerStub } from './work-tracker.stub';
import { WorkItemIdStub } from '../work-item-id/work-item-id.stub';
import { WorkUnitStub } from '../work-unit/work-unit.stub';

describe('workTrackerContract', () => {
  describe('parse()', () => {
    describe('valid input', () => {
      it('VALID: {all functions provided} => parses successfully', () => {
        const tracker = WorkTrackerStub();

        const result = workTrackerContract.parse(tracker);

        expect(result).toStrictEqual({
          getReadyWorkIds: expect.any(Function),
          getWorkUnit: expect.any(Function),
          markStarted: expect.any(Function),
          markCompleted: expect.any(Function),
          markFailed: expect.any(Function),
          markPartiallyCompleted: expect.any(Function),
          markBlocked: expect.any(Function),
          isAllComplete: expect.any(Function),
          isAllTerminal: expect.any(Function),
          getIncompleteIds: expect.any(Function),
          getFailedIds: expect.any(Function),
          addWorkItem: expect.any(Function),
        });
      });
    });

    describe('invalid input', () => {
      it('INVALID_GET_READY_WORK_IDS: {getReadyWorkIds: string} => throws', () => {
        expect(() =>
          workTrackerContract.parse({
            getReadyWorkIds: 'not-a-function',
            getWorkUnit: () => WorkUnitStub(),
            markStarted: () => undefined,
            markCompleted: () => undefined,
            markFailed: () => undefined,
            markPartiallyCompleted: () => undefined,
            markBlocked: () => undefined,
            isAllComplete: () => false,
            isAllTerminal: () => false,
            getIncompleteIds: () => [],
            getFailedIds: () => [],
            addWorkItem: () => undefined,
          }),
        ).toThrow(/Expected function, received string/u);
      });

      it('INVALID_MULTIPLE: {missing all functions} => throws', () => {
        expect(() => workTrackerContract.parse({})).toThrow(/Required/u);
      });
    });
  });

  describe('WorkTrackerStub()', () => {
    describe('default behavior', () => {
      it('VALID: {default} => getReadyWorkIds returns array with one item', () => {
        const { getReadyWorkIds } = WorkTrackerStub();

        const result = getReadyWorkIds();

        expect(result).toStrictEqual([WorkItemIdStub()]);
      });

      it('VALID: {default} => isAllComplete returns false', () => {
        const { isAllComplete } = WorkTrackerStub();

        const result = isAllComplete();

        expect(result).toBe(false);
      });

      it('VALID: {default} => getFailedIds returns empty array', () => {
        const { getFailedIds } = WorkTrackerStub();

        const result = getFailedIds();

        expect(result).toStrictEqual([]);
      });

      it('VALID: {default} => markStarted resolves', async () => {
        const { markStarted } = WorkTrackerStub();
        const workItemId = WorkItemIdStub();

        await expect(markStarted({ workItemId })).resolves.toBeUndefined();
      });

      it('VALID: {default} => addWorkItem completes without error', () => {
        const { addWorkItem } = WorkTrackerStub();
        const workItemId = WorkItemIdStub();
        const workUnit = WorkUnitStub();

        expect(() => {
          addWorkItem({ workItemId, workUnit });
        }).not.toThrow();
      });
    });

    describe('custom overrides', () => {
      it('VALID: {custom isAllComplete} => uses provided function', () => {
        const { isAllComplete } = WorkTrackerStub({
          isAllComplete: () => true,
        });

        const result = isAllComplete();

        expect(result).toBe(true);
      });

      it('VALID: {custom getReadyWorkIds} => uses provided function', () => {
        const customId = WorkItemIdStub({ value: 'custom-item' });
        const { getReadyWorkIds } = WorkTrackerStub({
          getReadyWorkIds: () => [customId],
        });

        const result = getReadyWorkIds();

        expect(result).toStrictEqual([customId]);
      });
    });
  });
});
