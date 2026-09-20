import { buildSequenceContract } from './build-sequence-contract';
import { BuildSequenceStub } from './build-sequence.stub';

describe('buildSequenceContract', () => {
  describe('valid build sequences', () => {
    it('VALID: {value: 0} => returns 0', () => {
      expect(BuildSequenceStub({ value: 0 })).toBe(0);
    });

    it('VALID: {value: 2} => returns 2', () => {
      expect(BuildSequenceStub({ value: 2 })).toBe(2);
    });
  });

  describe('invalid build sequences', () => {
    it('INVALID: {value: -1} => throws "Number must be greater than or equal to 0"', () => {
      expect(() => buildSequenceContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws "Expected integer, received float"', () => {
      expect(() => buildSequenceContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });
  });
});
