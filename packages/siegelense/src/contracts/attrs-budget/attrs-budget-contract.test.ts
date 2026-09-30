import { AttrsBudgetStub } from './attrs-budget.stub';
import { attrsBudgetContract } from './attrs-budget-contract';

describe('attrsBudgetContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = AttrsBudgetStub();

      expect(attrsBudgetContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {kept: wrong type} => throws', () => {
      expect(() => attrsBudgetContract.parse({ ...AttrsBudgetStub(), kept: 123 })).toThrow(
        /expected|invalid/iu,
      );
    });
  });
});
