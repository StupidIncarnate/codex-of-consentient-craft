import { recipeInputKeyContract } from './recipe-input-key-contract';
import { RecipeInputKeyStub } from './recipe-input-key.stub';

describe('recipeInputKeyContract', () => {
  describe('valid input keys', () => {
    it('VALID: {value: "guildPath"} => returns "guildPath"', () => {
      expect(RecipeInputKeyStub({ value: 'guildPath' })).toBe('guildPath');
    });
  });

  describe('invalid input keys', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => recipeInputKeyContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
