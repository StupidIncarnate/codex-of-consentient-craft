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
          isAllComplete: expect.any(Function),
          isAllTerminal: expect.any(Function),
          getIncompleteIds: expect.any(Function),
          getFailedIds: expect.any(Function),
          addWorkItem: expect.any(Function),
          skipAllPending: expect.any(Function),
        });
      });
    });

    describe('invalid input', () => {
      it('INVALID: {getReadyWorkIds: string} => throws', () => {
        expect(() =>
          workTrackerContract.parse({
            getReadyWorkIds: 'not-a-function',
            getWorkUnit: () => WorkUnitStub(),
            markStarted: () => undefined,
            markCompleted: () => undefined,
            markFailed: () => undefined,
            isAllComplete: () => false,
            isAllTerminal: () => false,
            getIncompleteIds: () => [],
            getFailedIds: () => [],
            addWorkItem: () => undefined,
            skipAllPending: () => undefined,
          }),
        ).toThrow(/Expected function, received string/u);
      });

      it('INVALID: {missing all functions} => throws', () => {
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

        await expect(markStarted({ workItemId })).resolves.toBe(undefined);
      });

      it('VALID: {default} => skipAllPending completes without error', () => {
        const { skipAllPending } = WorkTrackerStub();

        skipAllPending();

        expect(true).toBe(true);
      });

      it('VALID: {default} => addWorkItem completes without error', () => {
        const { addWorkItem } = WorkTrackerStub();
        const workItemId = WorkItemIdStub();
        const workUnit = WorkUnitStub();

        addWorkItem({ workItemId, workUnit });

        expect(true).toBe(true);
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
