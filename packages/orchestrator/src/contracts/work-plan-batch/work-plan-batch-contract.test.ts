import { WorkPlanPieceStub } from '../work-plan-piece/work-plan-piece.stub';

import { workPlanBatchContract } from './work-plan-batch-contract';
import { WorkPlanBatchStub } from './work-plan-batch.stub';

describe('workPlanBatchContract', () => {
  describe('valid batches', () => {
    it('VALID: {no overrides} => parses one parallel batch holding one piece', () => {
      const batch = WorkPlanBatchStub();

      expect({ mode: batch.mode, pieceIds: batch.pieces.map((piece) => piece.id) }).toStrictEqual({
        mode: 'parallel',
        pieceIds: ['pc-badge'],
      });
    });

    it('VALID: {mode: sequential, two pieces} => both survive in declaration order', () => {
      const batch = WorkPlanBatchStub({
        mode: 'sequential',
        pieces: [WorkPlanPieceStub({ id: 'pc-one' }), WorkPlanPieceStub({ id: 'pc-two' })],
      });

      expect({ mode: batch.mode, pieceIds: batch.pieces.map((piece) => piece.id) }).toStrictEqual({
        mode: 'sequential',
        pieceIds: ['pc-one', 'pc-two'],
      });
    });
  });

  describe('invalid batches', () => {
    it('EMPTY: {pieces: []} => refused, since an empty batch forecasts nothing', () => {
      expect(() => WorkPlanBatchStub({ pieces: [] })).toThrow(
        /Array must contain at least 1 element/u,
      );
    });

    it('INVALID: {mode: concurrent} => refused', () => {
      expect(() => WorkPlanBatchStub({ mode: 'concurrent' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('EMPTY: {empty object} => refused', () => {
      expect(workPlanBatchContract.safeParse({}).success).toBe(false);
    });
  });
});
