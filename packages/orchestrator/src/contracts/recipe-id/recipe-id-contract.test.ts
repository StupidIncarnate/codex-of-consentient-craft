import { recipeIdContract } from './recipe-id-contract';
import { RecipeIdStub } from './recipe-id.stub';

describe('recipeIdContract', () => {
  describe('valid recipe ids', () => {
    it('VALID: {no overrides} => parses the default stub value', () => {
      expect(RecipeIdStub()).toBe('session-with-nested-chain');
    });

    it('VALID: {single kebab segment} => parses', () => {
      expect(RecipeIdStub({ value: 'guild' })).toBe('guild');
    });

    it('VALID: {digits inside a segment} => parses', () => {
      expect(RecipeIdStub({ value: 'quest-advances-1-step' })).toBe('quest-advances-1-step');
    });
  });

  describe('invalid recipe ids', () => {
    it('EMPTY: {empty string} => refused', () => {
      expect(recipeIdContract.safeParse('').success).toBe(false);
    });

    it('INVALID: {camelCase} => refused', () => {
      expect(recipeIdContract.safeParse('sessionWithNestedChain').success).toBe(false);
    });

    it('INVALID: {leading digit} => refused', () => {
      expect(recipeIdContract.safeParse('1-step').success).toBe(false);
    });

    it('INVALID: {double hyphen} => refused', () => {
      expect(recipeIdContract.safeParse('session--chain').success).toBe(false);
    });

    it('INVALID: {trailing hyphen} => refused', () => {
      expect(recipeIdContract.safeParse('session-').success).toBe(false);
    });
  });
});
