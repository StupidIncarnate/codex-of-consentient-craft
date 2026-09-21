import { UnitObservationStub, WorkItemStub } from '@dungeonmaster/shared/contracts';

import { questWorkOutcomeDeriveTransformer } from './quest-work-outcome-derive-transformer';

describe('questWorkOutcomeDeriveTransformer', () => {
  describe('a step holding no units', () => {
    it("VALID: {assignedUnitIds: [], word: 'done'} => returns 'done'", () => {
      const workItem = WorkItemStub({ assignedUnitIds: [], observations: [] });

      const result = questWorkOutcomeDeriveTransformer({ workItem, word: 'done' });

      expect(result).toBe('done');
    });

    it("VALID: {assignedUnitIds: [], word: 'wall'} => returns 'wall'", () => {
      const workItem = WorkItemStub({ assignedUnitIds: [], observations: [] });

      const result = questWorkOutcomeDeriveTransformer({ workItem, word: 'wall' });

      expect(result).toBe('wall');
    });
  });

  describe('a step holding units', () => {
    it("VALID: {word: 'wall'} => returns 'wall' even though units are held, hitWall checked first", () => {
      const unitId = 'send-flow:observable:scan-finds-every-path';
      const workItem = WorkItemStub({
        assignedUnitIds: [unitId],
        observations: [],
      });

      const result = questWorkOutcomeDeriveTransformer({ workItem, word: 'wall' });

      expect(result).toBe('wall');
    });

    it("ERROR: {word: 'done', held units contradict it} => throws naming every contradicting unit id", () => {
      const metUnitId = 'send-flow:observable:scan-finds-every-path';
      const unmarkedUnitId = 'send-flow:terminal:forward-unchanged';
      const unmetUnitId = 'send-flow:branch:copy-failed';
      const workItem = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        assignedUnitIds: [metUnitId, unmarkedUnitId, unmetUnitId],
        observations: [
          UnitObservationStub({ unitId: metUnitId, mark: 'met' }),
          UnitObservationStub({ unitId: unmetUnitId, mark: 'unmet' }),
        ],
      });

      expect(() => questWorkOutcomeDeriveTransformer({ workItem, word: 'done' })).toThrow(
        /quest-work: work item f47ac10b-58cc-4372-a567-0e02b2c3d479 is assigned 3 unit\(s\).*send-flow:terminal:forward-unchanged.*send-flow:branch:copy-failed/su,
      );
    });
  });
});
