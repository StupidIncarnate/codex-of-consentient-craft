import { RecipeUnknownError } from './recipe-unknown-error';

describe('RecipeUnknownError', () => {
  describe('with a populated book', () => {
    it('ERROR: {an unknown name} => the message names it and lists every declared recipe', () => {
      const error = new RecipeUnknownError({
        name: 'guild-with-4-quests',
        known: ['guild-with-three-quests', 'session-with-nested-subagent'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeUnknownError',
        message:
          'UNKNOWN RECIPE: "guild-with-4-quests" is not in the recipe book. Declared: guild-with-three-quests, session-with-nested-subagent. Run `dungeonmaster siegelense recipes` for each one\'s produces: line and fidelity.',
      });
    });
  });

  describe('with an empty book', () => {
    it('EMPTY: {known: []} => the message says none are declared', () => {
      const error = new RecipeUnknownError({ name: 'anything', known: [] });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeUnknownError',
        message:
          'UNKNOWN RECIPE: "anything" is not in the recipe book. Declared: (none yet). Run `dungeonmaster siegelense recipes` for each one\'s produces: line and fidelity.',
      });
    });
  });

  describe('inheritance', () => {
    it('VALID: error instanceof Error => returns true', () => {
      expect(new RecipeUnknownError({ name: 'x', known: [] }) instanceof Error).toBe(true);
    });
  });
});
