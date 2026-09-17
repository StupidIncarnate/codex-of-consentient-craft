import { RecipeManifestStub } from '@dungeonmaster/siegelense-recipes/contracts';

import { RecipesAnswerStub } from '../../contracts/recipes-answer/recipes-answer.stub';

import { recipesAnswerRenderTransformer } from './recipes-answer-render-transformer';

describe('recipesAnswerRenderTransformer', () => {
  describe('an empty book', () => {
    it('EMPTY: {recipes: []} => returns the "no recipes yet" sentence naming the package', () => {
      const result = recipesAnswerRenderTransformer({
        answer: RecipesAnswerStub({ recipes: [] }),
      });

      expect(result).toBe(
        'No recipes yet — packages/siegelense-recipes/ holds none. Adding one lists it here.\n',
      );
    });
  });

  describe('a production recipe taking nothing', () => {
    it('VALID: {one production recipe} => renders produces:, fidelity with its risk, and returns — no mirrors, no takes', () => {
      const result = recipesAnswerRenderTransformer({
        answer: RecipesAnswerStub({
          recipes: [
            RecipeManifestStub({
              name: 'guild-with-three-quests',
              produces: 'one guild holding three quests, one in_progress',
              fidelity: 'production',
              mirrors: null,
              parameters: [],
              returns: [
                { name: 'guildId', description: 'the seeded guild' },
                { name: 'guildSlug', description: 'the route segment' },
                { name: 'questId', description: 'the in_progress one' },
              ],
            }),
          ],
        }),
      });

      expect(result).toBe(
        'guild-with-three-quests\n' +
          '  produces: one guild holding three quests, one in_progress\n' +
          '  fidelity: production — none; this is the honest one\n' +
          '  returns:  guildId, guildSlug, questId\n',
      );
    });
  });

  describe('a direct recipe naming its mirrors and its parameters', () => {
    it('VALID: {one direct recipe} => renders the drift risk, the mirrors pointer, and each parameter with whether it is required', () => {
      const result = recipesAnswerRenderTransformer({
        answer: RecipesAnswerStub({
          recipes: [
            RecipeManifestStub({
              name: 'session-with-nested-subagent',
              produces: 'one session transcript holding an outer sub-agent chain',
              fidelity: 'direct',
              mirrors: 'the Claude CLI session JSONL writer',
              parameters: [
                { name: 'guild', description: 'the guild', required: true },
                { name: 'at', description: 'the timestamp', required: false },
              ],
              returns: [{ name: 'sessions.nested', description: 'the nested chain route' }],
            }),
          ],
        }),
      });

      expect(result).toBe(
        'session-with-nested-subagent\n' +
          '  produces: one session transcript holding an outer sub-agent chain\n' +
          '  fidelity: direct — it can drift from what production actually writes\n' +
          '  mirrors:  the Claude CLI session JSONL writer\n' +
          '  takes:    guild (required), at (optional)\n' +
          '  returns:  sessions.nested\n',
      );
    });
  });

  describe('a captured recipe returning nothing', () => {
    it('EDGE: {a recipe with no returns} => omits the returns row rather than printing a blank one', () => {
      const result = recipesAnswerRenderTransformer({
        answer: RecipesAnswerStub({
          recipes: [
            RecipeManifestStub({
              name: 'rate-limit-window',
              produces: 'the rate-limit reading the cards render',
              fidelity: 'captured',
              mirrors: null,
              parameters: [],
              returns: [],
            }),
          ],
        }),
      });

      expect(result).toBe(
        'rate-limit-window\n' +
          '  produces: the rate-limit reading the cards render\n' +
          '  fidelity: captured — the only one that cannot lie about shape\n',
      );
    });
  });

  describe('the whole book', () => {
    it('VALID: {two recipes} => renders both blocks, blank-line separated, each carrying its own produces: and fidelity', () => {
      const result = recipesAnswerRenderTransformer({
        answer: RecipesAnswerStub({
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
              produces:
                'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
              fidelity: 'direct',
              mirrors: 'the Claude CLI session JSONL writer',
              parameters: [{ name: 'guild', description: 'the guild', required: true }],
              returns: [{ name: 'sessions.nested', description: 'the nested chain route' }],
            }),
          ],
        }),
      });

      expect(result).toBe(
        'guild-with-three-quests\n' +
          '  produces: one guild holding three quests, one in_progress\n' +
          '  fidelity: production — none; this is the honest one\n' +
          '  returns:  guildId\n' +
          '\n' +
          'session-with-nested-subagent\n' +
          '  produces: one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished\n' +
          '  fidelity: direct — it can drift from what production actually writes\n' +
          '  mirrors:  the Claude CLI session JSONL writer\n' +
          '  takes:    guild (required)\n' +
          '  returns:  sessions.nested\n',
      );
    });
  });
});
