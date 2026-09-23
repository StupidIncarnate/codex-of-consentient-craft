import { UnitObservationStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { workItemUnitMarksTransformer } from './work-item-unit-marks-transformer';

describe('workItemUnitMarksTransformer', () => {
  describe('valid work items', () => {
    it('VALID: {assignedUnitIds with a matching observation} => reads its real mark', () => {
      const workItem = WorkItemStub({
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        observations: [UnitObservationStub({ mark: 'met' })],
      });

      const result = workItemUnitMarksTransformer({ workItem });

      expect(result).toStrictEqual([
        { unitId: 'send-flow:observable:check-badge-count-text', mark: 'met' },
      ]);
    });

    it('VALID: {assignedUnitIds with no matching observation} => marks it unmarked', () => {
      const workItem = WorkItemStub({
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        observations: [],
      });

      const result = workItemUnitMarksTransformer({ workItem });

      expect(result).toStrictEqual([
        { unitId: 'send-flow:observable:check-badge-count-text', mark: 'unmarked' },
      ]);
    });

    it('VALID: {three assigned units, two observed} => follows assignedUnitIds order, not observations order', () => {
      const workItem = WorkItemStub({
        assignedUnitIds: [
          'send-flow:observable:check-badge-count-text',
          'send-flow:terminal:review-passes',
          'send-flow:branch:takes-happy-path',
        ],
        observations: [
          UnitObservationStub({
            unitId: 'send-flow:terminal:review-passes',
            mark: 'cant-meet',
            toSettle: 'add an admin fixture to the seed data',
          }),
          UnitObservationStub({
            unitId: 'send-flow:observable:check-badge-count-text',
            mark: 'unmet',
          }),
        ],
      });

      const result = workItemUnitMarksTransformer({ workItem });

      expect(result).toStrictEqual([
        { unitId: 'send-flow:observable:check-badge-count-text', mark: 'unmet' },
        { unitId: 'send-flow:terminal:review-passes', mark: 'cant-meet' },
        { unitId: 'send-flow:branch:takes-happy-path', mark: 'unmarked' },
      ]);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {workItem with no assigned units} => returns an empty array', () => {
      const workItem = WorkItemStub({ assignedUnitIds: [] });

      expect(workItemUnitMarksTransformer({ workItem })).toStrictEqual([]);
    });

    it('EMPTY: {workItem: undefined} => returns an empty array', () => {
      expect(workItemUnitMarksTransformer({ workItem: undefined })).toStrictEqual([]);
    });
  });
});
