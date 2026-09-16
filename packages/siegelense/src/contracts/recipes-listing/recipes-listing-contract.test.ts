import { recipesListingContract } from './recipes-listing-contract';
import { RecipesListingStub } from './recipes-listing.stub';

import { RecipeListingEntryStub } from '../recipe-listing-entry/recipe-listing-entry.stub';

describe('recipesListingContract', () => {
  describe('valid listings', () => {
    it('VALID: {one entry} => returns the entry', () => {
      const entry = RecipeListingEntryStub({ recipeName: 'guild-mid-execution' });

      const result = RecipesListingStub({ value: [entry] });

      expect(result).toStrictEqual([entry]);
    });

    it('EMPTY: {[]} => returns [], meaning no recipes declared yet', () => {
      const result = RecipesListingStub({ value: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid listings', () => {
    it('INVALID: {two entries sharing a name} => throws naming both indexes', () => {
      const first = RecipeListingEntryStub({ recipeName: 'guild-mid-execution' });
      const second = RecipeListingEntryStub({
        recipeName: 'guild-mid-execution',
        description: 'a different description, same name',
      });

      expect(() => recipesListingContract.parse([first, second])).toThrow(
        /recipes at index 0 and 1 both declare the name 'guild-mid-execution'/u,
      );
    });
  });
});
