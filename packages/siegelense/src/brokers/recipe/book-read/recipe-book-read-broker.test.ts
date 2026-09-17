import { RecipePackageMissingError } from '../../../errors/recipe-package-missing/recipe-package-missing-error';

import { recipeBookReadBroker } from './recipe-book-read-broker';
import { recipeBookReadBrokerProxy } from './recipe-book-read-broker.proxy';

describe('recipeBookReadBroker', () => {
  describe('the recipes package is present', () => {
    it('VALID: {the declared book} => returns both recipes with their own produces: text and fidelity', async () => {
      const proxy = recipeBookReadBrokerProxy();
      proxy.setupPackagePresent();

      const result = await recipeBookReadBroker();

      expect(result).toStrictEqual({
        recipes: [
          {
            name: 'guild-with-three-quests',
            produces: 'one guild holding three quests, one in_progress',
            fidelity: 'production',
            mirrors: null,
            parameters: [],
            returns: [
              {
                name: 'guildId',
                description: 'the seeded guild, for a later recipe that stacks onto it',
              },
              {
                name: 'guildSlug',
                description: "the guild's own route segment",
              },
              {
                name: 'questId',
                description:
                  'the one quest left in_progress, the one an assertion must tell from the other two',
              },
            ],
          },
          {
            name: 'session-with-nested-subagent',
            produces:
              'one session transcript holding an outer sub-agent chain with one chain nested inside it, both finished',
            fidelity: 'direct',
            mirrors:
              'the Claude CLI session transcript writer — its on-disk location is claudePathSlugEncoderTransformer, its line shapes are the stream-line stubs in @dungeonmaster/shared/contracts',
            parameters: [
              {
                name: 'guild',
                description:
                  "the guild the transcript is filed under — an earlier recipe's guildId, passed explicitly",
                required: true,
              },
            ],
            returns: [
              { name: 'sessionId', description: 'the session the outer chain was written as' },
              {
                name: 'sessions.outer',
                description: 'the route that renders the outer sub-agent chain',
              },
              {
                name: 'sessions.nested',
                description: 'the route that renders the chain nested inside it',
              },
            ],
          },
        ],
      });
    });

    it('VALID: {the declared book} => orders entries by name, so two calls list them alike', async () => {
      const proxy = recipeBookReadBrokerProxy();
      proxy.setupPackagePresent();

      const result = await recipeBookReadBroker();

      expect(result.recipes.map((recipe) => recipe.name)).toStrictEqual([
        'guild-with-three-quests',
        'session-with-nested-subagent',
      ]);
    });

    it('VALID: {the direct recipe} => carries a mirrors: pointer, and the production one carries none', async () => {
      const proxy = recipeBookReadBrokerProxy();
      proxy.setupPackagePresent();

      const result = await recipeBookReadBroker();

      expect(
        result.recipes.map((recipe) => ({
          fidelity: recipe.fidelity,
          hasMirrors: recipe.mirrors !== null,
        })),
      ).toStrictEqual([
        { fidelity: 'production', hasMirrors: false },
        { fidelity: 'direct', hasMirrors: true },
      ]);
    });
  });

  describe('the recipes package is absent', () => {
    it('ERROR: {no packages/siegelense-recipes} => throws a message naming the path and dungeonmaster init, never an empty list', async () => {
      const proxy = recipeBookReadBrokerProxy();
      proxy.setupPackageAbsent();

      await expect(recipeBookReadBroker()).rejects.toThrow(
        /^No recipes package at "\/repo\/packages\/siegelense-recipes"\. That path is a convention, not a setting — every repo siegelense runs in has it, and an empty one is a real answer meaning "no recipes yet"\. Its absence means siegelense was never installed here: run dungeonmaster init\.$/u,
      );
    });

    it('ERROR: {no packages/siegelense-recipes} => throws RecipePackageMissingError, so a caller tells it from a read failure', async () => {
      const proxy = recipeBookReadBrokerProxy();
      proxy.setupPackageAbsent();

      await expect(recipeBookReadBroker()).rejects.toThrow(RecipePackageMissingError);
    });
  });
});
