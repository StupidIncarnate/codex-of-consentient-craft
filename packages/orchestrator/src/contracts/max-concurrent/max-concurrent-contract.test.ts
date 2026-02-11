import { maxConcurrentContract } from './max-concurrent-contract';
import { MaxConcurrentStub } from './max-concurrent.stub';

describe('maxConcurrentContract', () => {
  describe('valid values', () => {
    it('VALID: {value: 1} => parses minimum concurrency', () => {
      const result = MaxConcurrentStub({ value: 1 });

      expect(result).toBe(1);
    });

    it('VALID: {value: 10} => parses higher concurrency', () => {
      const result = MaxConcurrentStub({ value: 10 });

      expect(result).toBe(10);
    });
  });

  describe('invalid values', () => {
    it('INVALID_VALUE: {value: 0} => throws too small error', () => {
      expect(() => maxConcurrentContract.parse(0)).toThrow(/too_small/u);
    });

    it('INVALID_VALUE: {value: -1} => throws too small error', () => {
      expect(() => maxConcurrentContract.parse(-1)).toThrow(/too_small/u);
    });

    it('INVALID_VALUE: {value: 1.5} => throws invalid type error', () => {
      expect(() => maxConcurrentContract.parse(1.5)).toThrow(/invalid_type/u);
    });
  });
});
