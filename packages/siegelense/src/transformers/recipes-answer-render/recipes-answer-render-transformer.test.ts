import { recipesAnswerRenderTransformer } from './recipes-answer-render-transformer';

import { RecipeListingEntryStub } from '../../contracts/recipe-listing-entry/recipe-listing-entry.stub';
import { RecipesAnswerStub } from '../../contracts/recipes-answer/recipes-answer.stub';

describe('recipesAnswerRenderTransformer', () => {
  describe('a paramless serverless entry', () => {
    it('VALID: {inputKeys: [], runs: serverless} => renders the complete block, aligned inputs and runs', () => {
      const entry = RecipeListingEntryStub({
        recipeName: 'guild-mid-execution',
        description: 'one guild holding three quests',
        inputKeys: [],
        runs: { serverless: true },
        makes: [{ ingredient: 'guild', count: 1 }],
      });
      const answer = RecipesAnswerStub({ recipes: [entry] });

      const result = recipesAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '  guild-mid-execution\n' +
          '    one guild holding three quests\n' +
          '    inputs:  none\n' +
          '    runs:    serverless\n' +
          '    makes:   guild ×1\n',
      );
    });
  });

  describe('an entry needing a server', () => {
    it('VALID: {runs: {serverless: false, needsServerFor: guild}} => renders "needs a server: guild"', () => {
      const entry = RecipeListingEntryStub({
        recipeName: 'session-mid-execution',
        description: 'one session under a guild with a live socket open',
        inputKeys: ['guildPath'],
        runs: { serverless: false, needsServerFor: 'guild' },
        makes: [{ ingredient: 'session', count: 1 }],
      });
      const answer = RecipesAnswerStub({ recipes: [entry] });

      const result = recipesAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '  session-mid-execution\n' +
          '    one session under a guild with a live socket open\n' +
          '    inputs:  guildPath\n' +
          '    runs:    needs a server: guild\n' +
          '    makes:   session ×1\n',
      );
    });
  });

  describe('an entry whose makes holds a varies count', () => {
    it('VALID: {makes: [{ingredient: operation, count: varies}]} => renders "operation (varies)"', () => {
      const entry = RecipeListingEntryStub({
        recipeName: 'guild-mid-execution',
        description: 'one guild holding three quests, the first running',
        inputKeys: [],
        runs: { serverless: true },
        makes: [{ ingredient: 'operation', count: 'varies' }],
      });
      const answer = RecipesAnswerStub({ recipes: [entry] });

      const result = recipesAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '  guild-mid-execution\n' +
          '    one guild holding three quests, the first running\n' +
          '    inputs:  none\n' +
          '    runs:    serverless\n' +
          '    makes:   operation (varies)\n',
      );
    });
  });

  describe('an entry declaring more than one input key', () => {
    it('VALID: {inputKeys: [guildPath, note]} => renders both, comma-joined', () => {
      const entry = RecipeListingEntryStub({
        recipeName: 'session-with-nested-chain',
        description: 'one session under an existing guild, holding a nested sub-agent chain',
        inputKeys: ['guildPath', 'note'],
        runs: { serverless: true },
        makes: [{ ingredient: 'session', count: 1 }],
      });
      const answer = RecipesAnswerStub({ recipes: [entry] });

      const result = recipesAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '  session-with-nested-chain\n' +
          '    one session under an existing guild, holding a nested sub-agent chain\n' +
          '    inputs:  guildPath, note\n' +
          '    runs:    serverless\n' +
          '    makes:   session ×1\n',
      );
    });
  });

  describe("two recipes, matching the specification's own listing example", () => {
    it('VALID: {two recipes} => both blocks render, separated by one blank line', () => {
      const guildMidExecution = RecipeListingEntryStub({
        recipeName: 'guild-mid-execution',
        description:
          'one guild holding three quests, the first running with its riftcarver item dropped',
        inputKeys: [],
        runs: { serverless: true },
        makes: [
          { ingredient: 'guild', count: 1 },
          { ingredient: 'quest', count: 3 },
          { ingredient: 'operation', count: 'varies' },
        ],
      });
      const sessionWithNestedChain = RecipeListingEntryStub({
        recipeName: 'session-with-nested-chain',
        description: 'one session under an existing guild, holding a nested sub-agent chain',
        inputKeys: ['guildPath'],
        runs: { serverless: true },
        makes: [{ ingredient: 'session', count: 1 }],
      });
      const answer = RecipesAnswerStub({ recipes: [guildMidExecution, sessionWithNestedChain] });

      const result = recipesAnswerRenderTransformer({ answer });

      expect(result).toBe(
        '  guild-mid-execution\n' +
          '    one guild holding three quests, the first running with its riftcarver item dropped\n' +
          '    inputs:  none\n' +
          '    runs:    serverless\n' +
          '    makes:   guild ×1, quest ×3, operation (varies)\n' +
          '\n' +
          '  session-with-nested-chain\n' +
          '    one session under an existing guild, holding a nested sub-agent chain\n' +
          '    inputs:  guildPath\n' +
          '    runs:    serverless\n' +
          '    makes:   session ×1\n',
      );
    });
  });

  describe('no recipes declared', () => {
    it('EMPTY: {recipes: []} => renders "no recipes declared yet", never a blank string', () => {
      const answer = RecipesAnswerStub({ recipes: [] });

      const result = recipesAnswerRenderTransformer({ answer });

      expect(result).toBe('no recipes declared yet\n');
    });
  });
});
