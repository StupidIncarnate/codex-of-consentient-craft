import { RecipeManifestStub } from '@dungeonmaster/siegelense-recipes/contracts';

import { recipesAnswerContract } from './recipes-answer-contract';
import { RecipesAnswerStub } from './recipes-answer.stub';

describe('recipesAnswerContract', () => {
  describe('valid answers', () => {
    it('EMPTY: {recipes: []} => the "no recipes yet" answer parses', () => {
      const answer = RecipesAnswerStub({ recipes: [] });

      const result = recipesAnswerContract.parse(answer);

      expect(result).toStrictEqual({ recipes: [] });
    });

    it('VALID: {two manifests} => round-trips both whole, produces: and fidelity included', () => {
      const answer = RecipesAnswerStub({
        recipes: [
          RecipeManifestStub({
            name: 'guild-with-three-quests',
            produces: 'one guild holding three quests, one in_progress',
            fidelity: 'production',
            mirrors: null,
            parameters: [],
            returns: [{ name: 'guildId', description: 'the seeded guild' }],
          }),
          RecipeManifestStub({
            name: 'session-with-nested-subagent',
            produces: 'one session transcript holding an outer sub-agent chain',
            fidelity: 'direct',
            mirrors: 'the Claude CLI session JSONL writer',
            parameters: [{ name: 'guild', description: 'the guild', required: true }],
            returns: [{ name: 'sessions.nested', description: 'the nested chain route' }],
          }),
        ],
      });

      const result = recipesAnswerContract.parse(answer);

      expect(result).toStrictEqual({
        recipes: [
          {
            name: 'guild-with-three-quests',
            produces: 'one guild holding three quests, one in_progress',
            fidelity: 'production',
            mirrors: null,
            parameters: [],
            returns: [{ name: 'guildId', description: 'the seeded guild' }],
          },
          {
            name: 'session-with-nested-subagent',
            produces: 'one session transcript holding an outer sub-agent chain',
            fidelity: 'direct',
            mirrors: 'the Claude CLI session JSONL writer',
            parameters: [{ name: 'guild', description: 'the guild', required: true }],
            returns: [{ name: 'sessions.nested', description: 'the nested chain route' }],
          },
        ],
      });
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

    it('INVALID: {extra key "count"} => throws Unrecognized key — an empty list is already unambiguous', () => {
      expect(() => recipesAnswerContract.parse({ recipes: [], count: 0 } as never)).toThrow(
        /Unrecognized key/u,
      );
    });
  });
});
