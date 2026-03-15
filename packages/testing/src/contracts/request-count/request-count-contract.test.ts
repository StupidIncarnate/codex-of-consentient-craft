import { requestCountContract } from './request-count-contract';
import { RequestCountStub } from './request-count.stub';

describe('requestCountContract', () => {
  describe('valid data', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = RequestCountStub({ value: 0 });

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => parses positive integer', () => {
      const result = RequestCountStub({ value: 5 });

      expect(result).toBe(5);
    });
  });

  describe('invalid data', () => {
    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => requestCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => requestCountContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });
});
