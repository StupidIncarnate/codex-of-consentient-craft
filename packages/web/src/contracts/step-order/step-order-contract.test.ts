import { stepOrderContract } from './step-order-contract';
import { StepOrderStub } from './step-order.stub';

describe('stepOrderContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = stepOrderContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses positive integer', () => {
      const result = stepOrderContract.parse(1);

      expect(result).toBe(1);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative', () => {
      expect(() => stepOrderContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => stepOrderContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid step order with default value 1', () => {
      const result = StepOrderStub();

      expect(result).toBe(1);
    });

    it('VALID: {value: 5} => creates step order with custom value', () => {
      const result = StepOrderStub({ value: 5 });

      expect(result).toBe(5);
    });
  });
});
