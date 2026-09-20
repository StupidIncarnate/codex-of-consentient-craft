import { recipesAnswerContract } from './recipes-answer-contract';
import { RecipesAnswerStub } from './recipes-answer.stub';

import { RecipeListingEntryStub } from '../recipe-listing-entry/recipe-listing-entry.stub';

describe('recipesAnswerContract', () => {
  describe('valid answers', () => {
    it('EMPTY: {recipes: []} => parses — no recipes declared yet is a valid answer', () => {
      const answer = RecipesAnswerStub({ recipes: [] });

      const result = recipesAnswerContract.parse(answer);

      expect(result).toStrictEqual({ recipes: [] });
    });

    it('VALID: {recipes: [one entry]} => parses, keeping the entry complete', () => {
      const entry = RecipeListingEntryStub();
      const answer = RecipesAnswerStub({ recipes: [entry] });

      const result = recipesAnswerContract.parse(answer);

      expect(result).toStrictEqual({ recipes: [entry] });
    });
  });

  describe('invalid answers', () => {
    it('INVALID: {missing recipes} => raises exactly one issue, scoped to recipes', () => {
      const result = recipesAnswerContract.safeParse({});

      expect(result.success).toBe(false);
      expect(result.error?.issues).toStrictEqual([
        {
          code: 'invalid_type',
          expected: 'array',
          received: 'undefined',
          path: ['recipes'],
          message: 'Required',
        },
      ]);
    });

    it('INVALID: {extra key "count"} => throws Unrecognized key, no extra field is accepted', () => {
      expect(() =>
        recipesAnswerContract.parse({
          recipes: [],
          count: 0,
        } as never),
      ).toThrow(/Unrecognized key/u);
    });
  });
});
