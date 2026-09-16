import { ingredientHandleContract } from './ingredient-handle-contract';
import { IngredientHandleStub } from './ingredient-handle.stub';

describe('ingredientHandleContract', () => {
  describe('valid handles', () => {
    it('VALID: {ingredient: "quest", ref: "guild[0]/quest[2]"} => returns both', () => {
      const result = IngredientHandleStub({ ingredient: 'quest', ref: 'guild[0]/quest[2]' });

      expect(result).toStrictEqual({ ingredient: 'quest', ref: 'guild[0]/quest[2]' });
    });
  });

  describe('invalid handles', () => {
    it('INVALID: {no ref} => throws Required', () => {
      expect(() => ingredientHandleContract.parse({ ingredient: 'quest' })).toThrow(/Required/u);
    });

    it('INVALID: {ref: \'quest\'} => throws "must be an ancestor path"', () => {
      expect(() => ingredientHandleContract.parse({ ingredient: 'quest', ref: 'quest' })).toThrow(
        /must be an ancestor path like 'guild\[0\]\/quest\[2\]'/u,
      );
    });
  });
});
