import { recipeManifestContract } from './recipe-manifest-contract';
import { RecipeManifestStub } from './recipe-manifest.stub';
import { RecipeDefStub } from '../recipe-def/recipe-def.stub';

describe('recipeManifestContract', () => {
  describe('valid manifests', () => {
    it('VALID: {one entry} => returns the entry', () => {
      const entry = RecipeDefStub({
        recipeName: 'guild-mid-execution',
        description: 'one guild holding three quests',
      });

      const result = RecipeManifestStub({ value: [entry] });

      expect(result).toStrictEqual([entry]);
    });

    it('VALID: {[]} => an empty hydration-recipes returns an empty list, meaning no recipes yet', () => {
      const result = RecipeManifestStub({ value: [] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('invalid manifests', () => {
    it('INVALID: {two entries sharing a name} => throws naming both', () => {
      const first = RecipeDefStub({
        recipeName: 'guild-mid-execution',
        description: 'one guild holding three quests',
      });
      const second = RecipeDefStub({
        recipeName: 'guild-mid-execution',
        description: 'a different description, same name',
      });

      expect(() => recipeManifestContract.parse([first, second])).toThrow(
        /recipes at index 0 and 1 both declare the name 'guild-mid-execution'/u,
      );
    });
  });
});
