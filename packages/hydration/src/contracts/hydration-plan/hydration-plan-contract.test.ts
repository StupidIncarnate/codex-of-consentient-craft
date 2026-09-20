import { hydrationPlanContract } from './hydration-plan-contract';
import { HydrationPlanStub } from './hydration-plan.stub';
import { OpCreateStub } from '../op-create/op-create.stub';

describe('hydrationPlanContract', () => {
  describe('valid plans', () => {
    it('VALID: {recipeName, ops: [one op]} => returns both', () => {
      const result = HydrationPlanStub({
        recipeName: 'guild-mid-execution',
        ops: [OpCreateStub()],
      });

      expect(result).toStrictEqual({
        recipeName: 'guild-mid-execution',
        ops: [OpCreateStub()],
      });
    });

    it('VALID: {ops: []} => returns an empty plan, meaning this recipe makes nothing', () => {
      const result = HydrationPlanStub({ ops: [] });

      expect(result).toStrictEqual({ recipeName: 'guild-mid-execution', ops: [] });
    });
  });

  describe('invalid plans', () => {
    it('INVALID: {no recipeName} => throws Required', () => {
      expect(() => hydrationPlanContract.parse({ ops: [] })).toThrow(/Required/u);
    });
  });
});
