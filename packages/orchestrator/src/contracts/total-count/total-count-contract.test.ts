import { totalCountContract } from './total-count-contract';
import { TotalCountStub } from './total-count.stub';

describe('totalCountContract', () => {
  describe('valid counts', () => {
    it('VALID: {zero} => parses successfully', () => {
      const count = TotalCountStub({ value: 0 });

      const result = totalCountContract.parse(count);

      expect(result).toBe(0);
    });

    it('VALID: {positive integer} => parses successfully', () => {
      const count = TotalCountStub({ value: 8 });

      const result = totalCountContract.parse(count);

      expect(result).toBe(8);
    });
  });

  describe('invalid counts', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        totalCountContract.parse(-1);
      }).toThrow(/too_small/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        totalCountContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
