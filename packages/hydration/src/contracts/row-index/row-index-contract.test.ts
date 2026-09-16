import { rowIndexContract } from './row-index-contract';
import { RowIndexStub } from './row-index.stub';

describe('rowIndexContract', () => {
  describe('valid row indexes', () => {
    it('VALID: {value: 0} => returns 0', () => {
      expect(RowIndexStub({ value: 0 })).toBe(0);
    });

    it('VALID: {value: 2} => returns 2', () => {
      expect(RowIndexStub({ value: 2 })).toBe(2);
    });
  });

  describe('invalid row indexes', () => {
    it('INVALID: {value: -1} => throws "Number must be greater than or equal to 0"', () => {
      expect(() => rowIndexContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws "Expected integer, received float"', () => {
      expect(() => rowIndexContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });
  });
});
