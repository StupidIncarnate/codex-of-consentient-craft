import { completedCountContract } from './completed-count-contract';
import { CompletedCountStub } from './completed-count.stub';

describe('completedCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = completedCountContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 3} => parses positive integer', () => {
      const result = completedCountContract.parse(3);

      expect(result).toBe(3);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => completedCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => completedCountContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID: {value: "0"} => throws for string', () => {
      expect(() => completedCountContract.parse('0')).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid completed count with default value 3', () => {
      const result = CompletedCountStub();

      expect(result).toBe(3);
    });

    it('VALID: {value: 5} => creates completed count with custom value', () => {
      const result = CompletedCountStub({ value: 5 });

      expect(result).toBe(5);
    });
  });
});
