import { recipeNameContract } from './recipe-name-contract';
import { RecipeNameStub } from './recipe-name.stub';

describe('recipeNameContract', () => {
  describe('valid recipe names', () => {
    it('VALID: {value: "guild-mid-execution"} => returns "guild-mid-execution"', () => {
      expect(RecipeNameStub({ value: 'guild-mid-execution' })).toBe('guild-mid-execution');
    });
  });

  describe('invalid recipe names', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => recipeNameContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });
  });
});
