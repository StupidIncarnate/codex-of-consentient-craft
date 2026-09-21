import { pieceIdContract } from './piece-id-contract';
import { PieceIdStub } from './piece-id.stub';

describe('pieceIdContract', () => {
  describe('valid piece ids', () => {
    it('VALID: {value: "pc-1"} => parses and returns branded PieceId', () => {
      expect(PieceIdStub({ value: 'pc-1' })).toBe('pc-1');
    });

    it('VALID: {value: "pc-walk-1"} => parses a mnemonic hand-written id', () => {
      expect(PieceIdStub({ value: 'pc-walk-1' })).toBe('pc-walk-1');
    });
  });

  describe('invalid piece ids', () => {
    it('EMPTY: {value: ""} => throws', () => {
      expect(() => pieceIdContract.parse('')).toThrow(/String must contain at least 1/u);
    });
  });
});
