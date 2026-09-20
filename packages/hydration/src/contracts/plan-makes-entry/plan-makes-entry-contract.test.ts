import { planMakesEntryContract } from './plan-makes-entry-contract';
import { PlanMakesEntryStub } from './plan-makes-entry.stub';

describe('planMakesEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {ingredient: quest, count: 3} => returns both', () => {
      const result = PlanMakesEntryStub({ ingredient: 'quest', count: 3 });

      expect(result).toStrictEqual({ ingredient: 'quest', count: 3 });
    });

    it('VALID: {ingredient: operation, count: "varies"} => returns the literal varies', () => {
      const result = PlanMakesEntryStub({ ingredient: 'operation', count: 'varies' });

      expect(result).toStrictEqual({ ingredient: 'operation', count: 'varies' });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {count: 0} => throws "Number must be greater than 0"', () => {
      expect(() => planMakesEntryContract.parse({ ingredient: 'quest', count: 0 })).toThrow(
        /Number must be greater than 0/u,
      );
    });

    it('INVALID: {no ingredient} => throws "Required"', () => {
      expect(() => planMakesEntryContract.parse({ count: 3 })).toThrow(/Required/u);
    });
  });
});
