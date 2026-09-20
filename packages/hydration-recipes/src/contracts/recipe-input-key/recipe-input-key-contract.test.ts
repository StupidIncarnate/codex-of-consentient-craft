import { recipeInputKeyContract } from './recipe-input-key-contract';
import { RecipeInputKeyStub } from './recipe-input-key.stub';

describe('recipeInputKeyContract', () => {
  describe('valid input keys', () => {
    it('VALID: "guildId" => parses successfully', () => {
      expect(RecipeInputKeyStub({ value: 'guildId' })).toBe('guildId');
    });
  });

  describe('invalid input keys', () => {
    it('INVALID: empty string => throws validation error', () => {
      expect(() => recipeInputKeyContract.parse('')).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
