import { seedStepContract } from './seed-step-contract';
import { SeedStepStub } from './seed-step.stub';

describe('seedStepContract', () => {
  describe('valid seed steps', () => {
    it('VALID: {recipe, as} => returns the step with no params key', () => {
      const result = SeedStepStub({ recipe: 'guild-mid-execution', as: 'g' });

      expect(result).toStrictEqual({ step: 'seed', recipe: 'guild-mid-execution', as: 'g' });
    });

    it('VALID: {recipe, params, as} => returns the params', () => {
      const result = SeedStepStub({
        recipe: 'session-with-nested-chain',
        params: { guildId: 'g1' },
        as: 's',
      });

      expect(result).toStrictEqual({
        step: 'seed',
        recipe: 'session-with-nested-chain',
        params: { guildId: 'g1' },
        as: 's',
      });
    });

    it('VALID: {recipe, no as} => returns the step with no as key', () => {
      const result = SeedStepStub({ recipe: 'guild-mid-execution' });

      expect(result).toStrictEqual({ step: 'seed', recipe: 'guild-mid-execution' });
    });
  });

  describe('invalid seed steps', () => {
    it('INVALID: {no recipe} => throws Required', () => {
      expect(() => seedStepContract.parse({ step: 'seed' })).toThrow(/Required/u);
    });

    it('INVALID: {step: "nope"} => throws Invalid literal', () => {
      expect(() => seedStepContract.parse({ step: 'nope', recipe: 'guild-mid-execution' })).toThrow(
        /Invalid literal value/u,
      );
    });
  });
});
