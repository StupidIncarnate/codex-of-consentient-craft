import { recipeListingEntryContract } from './recipe-listing-entry-contract';
import { RecipeListingEntryStub } from './recipe-listing-entry.stub';

describe('recipeListingEntryContract', () => {
  describe('valid entries', () => {
    it('VALID: {a paramless entry} => parses with inputKeys []', () => {
      const result = RecipeListingEntryStub();

      expect(result).toStrictEqual({
        recipeName: 'guild-mid-execution',
        description: 'one guild holding three quests, the first running with its item dropped',
        inputKeys: [],
        runs: { serverless: true },
        makes: [{ ingredient: 'guild', count: 1 }],
      });
    });

    it('VALID: {runs: serverless false, needsServerFor: guild} => parses and keeps the ingredient name', () => {
      const result = RecipeListingEntryStub({
        runs: { serverless: false, needsServerFor: 'guild' },
      });

      expect(result.runs).toStrictEqual({ serverless: false, needsServerFor: 'guild' });
    });
  });

  describe('invalid entries', () => {
    it('INVALID: {runs: serverless false, no needsServerFor} => throws', () => {
      expect(() =>
        recipeListingEntryContract.parse({
          recipeName: 'guild-mid-execution',
          description: 'one guild holding three quests',
          inputKeys: [],
          runs: { serverless: false },
          makes: [],
        }),
      ).toThrow(/Required/u);
    });

    it('INVALID: {an entry carrying an unrecognised key} => throws naming that key', () => {
      expect(() => RecipeListingEntryStub({ bogusKey: 'nope' } as never)).toThrow(
        /Unrecognized key\(s\) in object: 'bogusKey'/u,
      );
    });
  });
});
