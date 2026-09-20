import { ingredientNameContract } from './ingredient-name-contract';
import { IngredientNameStub } from './ingredient-name.stub';

describe('ingredientNameContract', () => {
  describe('valid ingredient names', () => {
    it('VALID: {value: "quest"} => returns "quest"', () => {
      expect(IngredientNameStub({ value: 'quest' })).toBe('quest');
    });

    it('VALID: {value: "work-item"} => returns "work-item"', () => {
      expect(IngredientNameStub({ value: 'work-item' })).toBe('work-item');
    });
  });

  describe('invalid ingredient names', () => {
    it('INVALID: {value: ""} => throws "String must contain at least 1 character(s)"', () => {
      expect(() => ingredientNameContract.parse('')).toThrow(
        /String must contain at least 1 character\(s\)/u,
      );
    });

    it('INVALID: {value: "guild/quest"} => throws naming the character class a RowRef segment can encode', () => {
      expect(() => ingredientNameContract.parse('guild/quest')).toThrow(
        /must start with a letter and hold only letters, digits and hyphens/u,
      );
    });
  });
});
