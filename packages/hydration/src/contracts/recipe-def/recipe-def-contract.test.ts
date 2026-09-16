import { z } from 'zod';
import { recipeDefContract } from './recipe-def-contract';
import { RecipeDefStub } from './recipe-def.stub';

describe('recipeDefContract', () => {
  describe('valid recipe definitions', () => {
    it('VALID: {recipeName, description} => returns both and no inputs key', () => {
      const result = RecipeDefStub({
        recipeName: 'guild-mid-execution',
        description: 'one guild holding three quests',
      });

      expect(result).toStrictEqual({
        recipeName: 'guild-mid-execution',
        description: 'one guild holding three quests',
      });
    });

    it('VALID: {recipeName, description, inputs} => returns the schema', () => {
      const inputs = z.object({ guildId: z.string().brand<'GuildId'>() });

      const result = RecipeDefStub({
        recipeName: 'session-with-nested-chain',
        description: 'one session under an existing guild',
        inputs,
      });

      expect(result).toStrictEqual({
        recipeName: 'session-with-nested-chain',
        description: 'one session under an existing guild',
        inputs,
      });
    });
  });

  describe('invalid recipe definitions', () => {
    it('INVALID: {description: ""} => throws a blank description degrades the listing', () => {
      expect(() =>
        recipeDefContract.parse({ recipeName: 'guild-mid-execution', description: '' }),
      ).toThrow(/String must contain at least 1 character/u);
    });

    it('INVALID: {no recipeName} => throws Required', () => {
      expect(() =>
        recipeDefContract.parse({ description: 'one guild holding three quests' }),
      ).toThrow(/Required/u);
    });
  });
});
