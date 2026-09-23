import { UnitObservationStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { scopeUnitChurnTransformer } from './scope-unit-churn-transformer';

describe('scopeUnitChurnTransformer', () => {
  describe('units two or more work items marked', () => {
    it('VALID: {unmet then met, across two work items} => returns the sequence in work-item order', () => {
      const workItems = [
        WorkItemStub({
          step: 'work',
          observations: [
            UnitObservationStub({
              unitId: 'send-flow:observable:scan-finds-every-path',
              mark: 'unmet',
            }),
          ],
        }),
        WorkItemStub({
          step: 'review',
          observations: [
            UnitObservationStub({
              unitId: 'send-flow:observable:scan-finds-every-path',
              mark: 'met',
            }),
          ],
        }),
      ];

      const result = scopeUnitChurnTransformer({ workItems });

      expect(result).toStrictEqual([
        {
          unitId: 'send-flow:observable:scan-finds-every-path',
          marks: [
            { mark: 'unmet', workItemLabel: 'work' },
            { mark: 'met', workItemLabel: 'review' },
          ],
        },
      ]);
    });

    it('VALID: {a work item with no step} => labels that mark with the role instead', () => {
      const workItems = [
        WorkItemStub({
          role: 'ward',
          observations: [UnitObservationStub({ mark: 'unmet' })],
        }),
        WorkItemStub({
          role: 'ward',
          observations: [UnitObservationStub({ mark: 'met' })],
        }),
      ];

      const result = scopeUnitChurnTransformer({ workItems });

      expect(result[0]?.marks).toStrictEqual([
        { mark: 'unmet', workItemLabel: 'ward' },
        { mark: 'met', workItemLabel: 'ward' },
      ]);
    });
  });

  describe('units only one work item marked', () => {
    it('EDGE: {a unit observed by a single work item} => is dropped, not returned as a one-step churn', () => {
      const workItems = [
        WorkItemStub({ step: 'work', observations: [UnitObservationStub({ mark: 'met' })] }),
      ];

      expect(scopeUnitChurnTransformer({ workItems })).toStrictEqual([]);
    });
  });

  describe('empty scopes', () => {
    it('EMPTY: {workItems: []} => returns an empty array', () => {
      expect(scopeUnitChurnTransformer({ workItems: [] })).toStrictEqual([]);
    });

    it('EMPTY: {work items with no observations} => returns an empty array', () => {
      const workItems = [WorkItemStub({ step: 'work', observations: [] })];

      expect(scopeUnitChurnTransformer({ workItems })).toStrictEqual([]);
    });
  });
});
