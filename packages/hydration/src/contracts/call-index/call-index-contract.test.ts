import { callIndexContract } from './call-index-contract';
import { CallIndexStub } from './call-index.stub';

describe('callIndexContract', () => {
  describe('valid call indexes', () => {
    it('VALID: {value: 0} => returns 0', () => {
      expect(CallIndexStub({ value: 0 })).toBe(0);
    });

    it('VALID: {value: 2} => returns 2', () => {
      expect(CallIndexStub({ value: 2 })).toBe(2);
    });
  });

  describe('invalid call indexes', () => {
    it('INVALID: {value: -1} => throws "Number must be greater than or equal to 0"', () => {
      expect(() => callIndexContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws "Expected integer, received float"', () => {
      expect(() => callIndexContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });
  });
});
