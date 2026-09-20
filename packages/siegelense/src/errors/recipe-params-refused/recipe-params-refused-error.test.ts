import { RecipeParamsRefusedError } from './recipe-params-refused-error';

describe('RecipeParamsRefusedError', () => {
  describe('constructor()', () => {
    it('VALID: {reason: unrecognized, accepted: one key} => names the recipe, the refused key, and the accepted keys', () => {
      const error = new RecipeParamsRefusedError({
        recipeName: 'session-with-nested-chain',
        key: 'guildId',
        reason: 'unrecognized',
        accepted: ['guildPath'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeParamsRefusedError',
        message:
          'Recipe "session-with-nested-chain" does not accept the param "guildId". Accepted params: guildPath.',
      });
    });

    it('EMPTY: {reason: unrecognized, accepted: []} => says the recipe takes no params, rather than an empty list', () => {
      const error = new RecipeParamsRefusedError({
        recipeName: 'guild-mid-execution',
        key: 'x',
        reason: 'unrecognized',
        accepted: [],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeParamsRefusedError',
        message:
          'Recipe "guild-mid-execution" does not accept the param "x". This recipe takes no params.',
      });
    });

    it('VALID: {reason: missing, accepted: one key} => names the recipe, the required key, and the accepted keys', () => {
      const error = new RecipeParamsRefusedError({
        recipeName: 'session-with-nested-chain',
        key: 'guildPath',
        reason: 'missing',
        accepted: ['guildPath'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeParamsRefusedError',
        message:
          'Recipe "session-with-nested-chain" requires the param "guildPath", which was not supplied. Accepted params: guildPath.',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof RecipeParamsRefusedError => returns true', () => {
      const error = new RecipeParamsRefusedError({
        recipeName: 'guild-mid-execution',
        key: 'x',
        reason: 'unrecognized',
        accepted: [],
      });

      expect(error instanceof RecipeParamsRefusedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new RecipeParamsRefusedError({
        recipeName: 'guild-mid-execution',
        key: 'x',
        reason: 'unrecognized',
        accepted: [],
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
