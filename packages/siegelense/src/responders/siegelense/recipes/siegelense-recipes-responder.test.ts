import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { RecipeListingEntryStub } from '../../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { RecipesAnswerStub } from '../../../contracts/recipes-answer/recipes-answer.stub';
import { RecipesListingStub } from '../../../contracts/recipes-listing/recipes-listing.stub';
import { RecipesBuildMissingError } from '../../../errors/recipes-build-missing/recipes-build-missing-error';
import { RecipesPackageMissingError } from '../../../errors/recipes-package-missing/recipes-package-missing-error';

import { SiegelenseRecipesResponder } from './siegelense-recipes-responder';
import { SiegelenseRecipesResponderProxy } from './siegelense-recipes-responder.proxy';

describe('SiegelenseRecipesResponder', () => {
  describe('a populated listing', () => {
    it('VALID: {no args, two recipes} => writes one block per recipe by default', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const recipes = RecipesListingStub({
        value: [
          RecipeListingEntryStub(),
          RecipeListingEntryStub({
            recipeName: 'session-with-nested-chain',
            description: 'one session chained under a guild',
            inputKeys: ['guildPath'],
            runs: { serverless: false, needsServerFor: 'guild' },
            makes: [
              { ingredient: 'session', count: 1 },
              { ingredient: 'operation', count: 'varies' },
            ],
          }),
        ],
      });
      proxy.stageListing({ recipes });

      await SiegelenseRecipesResponder();

      expect(proxy.getStdoutWrites()).toStrictEqual([
        '  guild-mid-execution\n' +
          '    one guild holding three quests, the first running with its item dropped\n' +
          '    inputs:  none\n' +
          '    runs:    serverless\n' +
          '    makes:   guild ×1\n' +
          '\n' +
          '  session-with-nested-chain\n' +
          '    one session chained under a guild\n' +
          '    inputs:  guildPath\n' +
          '    runs:    needs a server: guild\n' +
          '    makes:   session ×1, operation (varies)\n',
      ]);
    });

    it('VALID: {isJson: true, two recipes} => writes the RecipesAnswer as one JSON document', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const recipes = RecipesListingStub({
        value: [
          RecipeListingEntryStub(),
          RecipeListingEntryStub({
            recipeName: 'session-with-nested-chain',
            description: 'one session chained under a guild',
            inputKeys: ['guildPath'],
            runs: { serverless: false, needsServerFor: 'guild' },
            makes: [
              { ingredient: 'session', count: 1 },
              { ingredient: 'operation', count: 'varies' },
            ],
          }),
        ],
      });
      const answer = RecipesAnswerStub({ recipes });
      proxy.stageListing({ recipes });

      await SiegelenseRecipesResponder({ isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('VALID: {isJson: false, two recipes} => writes one block per recipe', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const recipes = RecipesListingStub({
        value: [
          RecipeListingEntryStub(),
          RecipeListingEntryStub({
            recipeName: 'session-with-nested-chain',
            description: 'one session chained under a guild',
            inputKeys: ['guildPath'],
            runs: { serverless: false, needsServerFor: 'guild' },
            makes: [
              { ingredient: 'session', count: 1 },
              { ingredient: 'operation', count: 'varies' },
            ],
          }),
        ],
      });
      proxy.stageListing({ recipes });

      await SiegelenseRecipesResponder({ isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        '  guild-mid-execution\n' +
          '    one guild holding three quests, the first running with its item dropped\n' +
          '    inputs:  none\n' +
          '    runs:    serverless\n' +
          '    makes:   guild ×1\n' +
          '\n' +
          '  session-with-nested-chain\n' +
          '    one session chained under a guild\n' +
          '    inputs:  guildPath\n' +
          '    runs:    needs a server: guild\n' +
          '    makes:   session ×1, operation (varies)\n',
      ]);
    });
  });

  describe('an empty listing — a built package declaring no recipes', () => {
    it('EMPTY: {no args, no recipes} => writes "no recipes declared yet" by default rather than refusing', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const recipes = RecipesListingStub({ value: [] });
      proxy.stageListing({ recipes });

      await SiegelenseRecipesResponder();

      expect(proxy.getStdoutWrites()).toStrictEqual(['no recipes declared yet\n']);
    });

    it('EMPTY: {isJson: true, no recipes} => writes the RecipesAnswer as one JSON document', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const recipes = RecipesListingStub({ value: [] });
      const answer = RecipesAnswerStub({ recipes });
      proxy.stageListing({ recipes });

      await SiegelenseRecipesResponder({ isJson: true });

      expect(proxy.getStdoutWrites()).toStrictEqual([
        `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
      ]);
    });

    it('EMPTY: {isJson: false, no recipes} => writes "no recipes declared yet" rather than refusing', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      const recipes = RecipesListingStub({ value: [] });
      proxy.stageListing({ recipes });

      await SiegelenseRecipesResponder({ isJson: false });

      expect(proxy.getStdoutWrites()).toStrictEqual(['no recipes declared yet\n']);
    });
  });

  describe('the recipes package has never been scaffolded', () => {
    it('ERROR: {package directory absent} => the refusal reaches the caller intact', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      proxy.stageError({
        error: new RecipesPackageMissingError({ packagePath: '/repo/packages/hydration-recipes' }),
      });

      await expect(SiegelenseRecipesResponder()).rejects.toStrictEqual(
        new RecipesPackageMissingError({ packagePath: '/repo/packages/hydration-recipes' }),
      );
    });
  });

  describe('the recipes package is present but unbuilt', () => {
    it('ERROR: {dist/index.js absent} => the refusal reaches the caller intact', async () => {
      const proxy = SiegelenseRecipesResponderProxy();
      proxy.stageError({
        error: new RecipesBuildMissingError({
          distPath: '/repo/packages/hydration-recipes/dist/index.js',
        }),
      });

      await expect(SiegelenseRecipesResponder()).rejects.toStrictEqual(
        new RecipesBuildMissingError({
          distPath: '/repo/packages/hydration-recipes/dist/index.js',
        }),
      );
    });
  });
});
