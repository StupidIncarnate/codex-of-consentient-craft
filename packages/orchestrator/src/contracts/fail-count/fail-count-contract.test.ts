import { failCountContract } from './fail-count-contract';
import { FailCountStub } from './fail-count.stub';

describe('failCountContract', () => {
  describe('valid values', () => {
    it('VALID: {0} => parses successfully', () => {
      const result = FailCountStub({ value: 0 });

      expect(result).toBe(0);
    });

    it('VALID: {3} => parses successfully', () => {
      const result = FailCountStub({ value: 3 });

      expect(result).toBe(3);
    });
  });

  describe('invalid values', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => {
        failCountContract.parse(-1);
      }).toThrow(/expected number to be >=0/u);
    });

    it('INVALID: {decimal number} => throws validation error', () => {
      expect(() => {
        failCountContract.parse(1.5);
      }).toThrow(/expected int/u);
    });

    it('INVALID: {string} => throws validation error', () => {
      expect(() => {
        failCountContract.parse('1' as never);
      }).toThrow(/expected number/u);
    });
  });
});
