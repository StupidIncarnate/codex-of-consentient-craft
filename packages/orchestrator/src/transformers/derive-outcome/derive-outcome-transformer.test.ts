import { UnitIdStub, UnitObservationStub } from '@dungeonmaster/shared/contracts';

import { StepOutcomeStub } from '../../contracts/step-outcome/step-outcome.stub';
import { deriveOutcomeTransformer } from './derive-outcome-transformer';

describe('deriveOutcomeTransformer', () => {
  describe('units settle the outcome', () => {
    it('VALID: {ten assigned units, one unmet among nine met} => derives unmet', () => {
      const metUnitIds = Array.from({ length: 9 }, (_unused, index) =>
        UnitIdStub({ value: `send-flow:observable:met-${index}` }),
      );
      const unmetUnitId = UnitIdStub({ value: 'send-flow:observable:unmet-unit' });
      const assignedUnitIds = [...metUnitIds, unmetUnitId];
      const observations = [
        ...metUnitIds.map((unitId) => UnitObservationStub({ unitId, mark: 'met' })),
        UnitObservationStub({ unitId: unmetUnitId, mark: 'unmet' }),
      ];

      const result = deriveOutcomeTransformer({ assignedUnitIds, observations, hitWall: false });

      expect(result).toBe('unmet');
    });

    it('VALID: {ten assigned units, all met} => derives done', () => {
      const assignedUnitIds = Array.from({ length: 10 }, (_unused, index) =>
        UnitIdStub({ value: `send-flow:observable:obs-${index}` }),
      );
      const observations = assignedUnitIds.map((unitId) =>
        UnitObservationStub({ unitId, mark: 'met' }),
      );

      const result = deriveOutcomeTransformer({ assignedUnitIds, observations, hitWall: false });

      expect(result).toBe('done');
    });

    it('VALID: {one met, one cant-meet} => derives done, because cant-meet settles a unit', () => {
      const metUnitId = UnitIdStub({ value: 'send-flow:observable:obs-met' });
      const cantMeetUnitId = UnitIdStub({ value: 'send-flow:observable:obs-cant-meet' });

      const result = deriveOutcomeTransformer({
        assignedUnitIds: [metUnitId, cantMeetUnitId],
        observations: [
          UnitObservationStub({ unitId: metUnitId, mark: 'met' }),
          UnitObservationStub({
            unitId: cantMeetUnitId,
            mark: 'cant-meet',
            toSettle: 'drive a real send and read the session JSONL for the write',
          }),
        ],
        hitWall: false,
      });

      expect(result).toBe('done');
    });

    it('VALID: {one assigned unit with no observation} => derives unmet, not a throw', () => {
      const unitId = UnitIdStub({ value: 'send-flow:observable:obs-unobserved' });

      const result = deriveOutcomeTransformer({
        assignedUnitIds: [unitId],
        observations: [],
        hitWall: false,
      });

      expect(result).toBe('unmet');
    });
  });

  describe('zero units, the step declares its own outcome', () => {
    it("VALID: {zero assigned units, declaredWord: 'empty'} => derives empty", () => {
      const result = deriveOutcomeTransformer({
        assignedUnitIds: [],
        observations: [],
        declaredWord: StepOutcomeStub({ value: 'empty' }),
        hitWall: false,
      });

      expect(result).toBe('empty');
    });

    it("VALID: {zero assigned units, declaredWord: 'done'} => derives done", () => {
      const result = deriveOutcomeTransformer({
        assignedUnitIds: [],
        observations: [],
        declaredWord: StepOutcomeStub({ value: 'done' }),
        hitWall: false,
      });

      expect(result).toBe('done');
    });

    it('ERROR: {zero assigned units, no declaredWord, hitWall: false} => throws naming all four words', () => {
      expect(() =>
        deriveOutcomeTransformer({ assignedUnitIds: [], observations: [], hitWall: false }),
      ).toThrow(
        new Error(
          'deriveOutcomeTransformer: no units were assigned and no declaredWord was given. A step ' +
            'holding no units is the one case that declares its own outcome — pass one of ' +
            'wall | unmet | done | empty.',
        ),
      );
    });
  });

  describe('units and a declaredWord together — always a throw', () => {
    it('ERROR: {three units, one unmet, declaredWord: done} => throws, naming the unmet unit as unsettled', () => {
      const unitA = UnitIdStub({ value: 'send-flow:observable:obs-a' });
      const unitB = UnitIdStub({ value: 'send-flow:observable:obs-b' });
      const unitC = UnitIdStub({ value: 'send-flow:observable:obs-c' });

      expect(() =>
        deriveOutcomeTransformer({
          assignedUnitIds: [unitA, unitB, unitC],
          observations: [
            UnitObservationStub({ unitId: unitA, mark: 'met' }),
            UnitObservationStub({ unitId: unitB, mark: 'unmet' }),
            UnitObservationStub({ unitId: unitC, mark: 'met' }),
          ],
          declaredWord: StepOutcomeStub({ value: 'done' }),
          hitWall: false,
        }),
      ).toThrow(
        new Error(
          "deriveOutcomeTransformer: declaredWord 'done' was given alongside 3 assigned units, " +
            `which derive 'unmet'. A step that holds units does not declare its outcome — the ` +
            `record does. Unsettled units: ${unitB}. Mark every unit met or cant-meet and drop ` +
            'declaredWord.',
        ),
      );
    });

    it("ERROR: {three units all met, declaredWord: done} => throws even though the record agrees, 'Unsettled units: none'", () => {
      const unitA = UnitIdStub({ value: 'send-flow:observable:obs-a' });
      const unitB = UnitIdStub({ value: 'send-flow:observable:obs-b' });
      const unitC = UnitIdStub({ value: 'send-flow:observable:obs-c' });

      expect(() =>
        deriveOutcomeTransformer({
          assignedUnitIds: [unitA, unitB, unitC],
          observations: [
            UnitObservationStub({ unitId: unitA, mark: 'met' }),
            UnitObservationStub({ unitId: unitB, mark: 'met' }),
            UnitObservationStub({ unitId: unitC, mark: 'met' }),
          ],
          declaredWord: StepOutcomeStub({ value: 'done' }),
          hitWall: false,
        }),
      ).toThrow(
        new Error(
          "deriveOutcomeTransformer: declaredWord 'done' was given alongside 3 assigned units, " +
            "which derive 'done'. A step that holds units does not declare its outcome — the " +
            'record does. Unsettled units: none. Mark every unit met or cant-meet and drop ' +
            'declaredWord.',
        ),
      );
    });
  });

  describe('the wall is checked FIRST, before either throw', () => {
    it('VALID: {nine assigned units all met, hitWall: true} => returns wall', () => {
      const assignedUnitIds = Array.from({ length: 9 }, (_unused, index) =>
        UnitIdStub({ value: `send-flow:observable:obs-${index}` }),
      );
      const observations = assignedUnitIds.map((unitId) =>
        UnitObservationStub({ unitId, mark: 'met' }),
      );

      const result = deriveOutcomeTransformer({ assignedUnitIds, observations, hitWall: true });

      expect(result).toBe('wall');
    });

    it('VALID: {units assigned, declaredWord present, hitWall: true} => returns wall and does not throw case B', () => {
      const unitId = UnitIdStub({ value: 'send-flow:observable:obs-a' });

      const result = deriveOutcomeTransformer({
        assignedUnitIds: [unitId],
        observations: [UnitObservationStub({ unitId, mark: 'met' })],
        declaredWord: StepOutcomeStub({ value: 'done' }),
        hitWall: true,
      });

      expect(result).toBe('wall');
    });

    it('VALID: {zero assigned units, no declaredWord, hitWall: true} => returns wall, not case A throw', () => {
      const result = deriveOutcomeTransformer({
        assignedUnitIds: [],
        observations: [],
        hitWall: true,
      });

      expect(result).toBe('wall');
    });
  });
});
