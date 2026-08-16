import { OperationPlanPieceStub } from '../operation-plan-piece/operation-plan-piece.stub';
import { operationPlanContract } from './operation-plan-contract';
import { OperationPlanStub } from './operation-plan.stub';

describe('operationPlanContract', () => {
  describe('valid plans', () => {
    it('VALID: {defaults} => parses with round defaulting to 1 and pieces defaulting to empty', () => {
      const plan = OperationPlanStub();

      expect(plan).toStrictEqual({
        id: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
        operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
        round: 1,
        discipline: 'implementation',
        summary:
          'The operation-plan-piece-id contract mirrors operation-item-id; no blockers found.',
        pieces: [],
        at: '2024-01-15T10:00:00.000Z',
      });
    });

    it('VALID: {round: 2} => parses a re-planned round', () => {
      const plan = OperationPlanStub({ round: 2 });

      expect(plan.round).toBe(2);
    });

    it('VALID: {pieces: one piece} => round-trips the piece', () => {
      const piece = OperationPlanPieceStub();
      const plan = OperationPlanStub({ pieces: [piece] });

      expect(plan.pieces).toStrictEqual([piece]);
    });

    it('VALID: {discipline: bug-repro} => parses a non-implementation discipline', () => {
      const plan = OperationPlanStub({ discipline: 'bug-repro' });

      expect(plan.discipline).toBe('bug-repro');
    });
  });

  describe('invalid plans', () => {
    it('INVALID: {round: 0} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ round: 0 });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {round: -1} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ round: -1 });
      }).toThrow(/too_small/u);
    });

    it('EDGE: {round: 1.5} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ round: 1.5 });
      }).toThrow(/Expected integer/u);
    });

    it('EMPTY: {discipline: ""} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ discipline: '' as never });
      }).toThrow(/too_small/u);
    });

    it('EMPTY: {summary: ""} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ summary: '' as never });
      }).toThrow(/too_small/u);
    });

    it('INVALID: {id: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return operationPlanContract.parse({
          id: 'not-a-uuid',
          operationItemId: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          workItemId: '9c4d8f1c-3e38-48c9-bdec-22b61883b473',
          discipline: 'implementation',
          summary: 'placeholder',
          at: '2024-01-15T10:00:00.000Z',
        });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {operationItemId: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ operationItemId: 'not-a-uuid' as never });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {workItemId: "not-a-uuid"} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ workItemId: 'not-a-uuid' as never });
      }).toThrow(/invalid_string/u);
    });

    it('INVALID: {at: "not-a-timestamp"} => throws validation error', () => {
      expect(() => {
        return OperationPlanStub({ at: 'not-a-timestamp' as never });
      }).toThrow(/Invalid datetime/u);
    });
  });
});
