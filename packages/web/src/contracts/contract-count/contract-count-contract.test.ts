import { contractCountContract } from './contract-count-contract';
import { ContractCountStub } from './contract-count.stub';

describe('contractCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => returns 0', () => {
      const result = ContractCountStub({ value: 0 });

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => returns 5', () => {
      const result = ContractCountStub({ value: 5 });

      expect(result).toBe(5);
    });

    it('VALID: {value: 2} => returns a valid ContractCount branded number', () => {
      const result = contractCountContract.parse(2);

      expect(result).toBe(2);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative count', () => {
      expect(() => ContractCountStub({ value: -1 as never })).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => ContractCountStub({ value: 1.5 as never })).toThrow(
        /Expected integer, received float/u,
      );
    });

    it('INVALID: {value: "x"} => throws for non-number', () => {
      expect(() => ContractCountStub({ value: 'x' as never })).toThrow(
        /Expected number, received string/u,
      );
    });
  });
});
