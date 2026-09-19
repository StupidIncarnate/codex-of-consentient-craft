import { RecipeReturnsMismatchError } from './recipe-returns-mismatch-error';

describe('RecipeReturnsMismatchError', () => {
  describe('an id returned but never declared', () => {
    it('ERROR: {undeclared: [guildPath]} => the message names it', () => {
      const error = new RecipeReturnsMismatchError({
        name: 'guild-with-three-quests',
        undeclared: ['guildPath'],
        unfulfilled: [],
        declared: ['guildId', 'guildSlug', 'questId'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeReturnsMismatchError',
        message:
          'RECIPE RETURNS: "guild-with-three-quests" produced ids its manifest does not match. Returned but never declared: guildPath. Its manifest declares: guildId, guildSlug, questId. The listing and the runner read ONE declaration — a recipe that made a thing it cannot name is a thing no step can reach.',
      });
    });
  });

  describe('a declared id that was not returned', () => {
    it('ERROR: {unfulfilled: [questId]} => the message names it', () => {
      const error = new RecipeReturnsMismatchError({
        name: 'guild-with-three-quests',
        undeclared: [],
        unfulfilled: ['questId'],
        declared: ['guildId', 'guildSlug', 'questId'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeReturnsMismatchError',
        message:
          'RECIPE RETURNS: "guild-with-three-quests" produced ids its manifest does not match. Declared but not returned: questId. Its manifest declares: guildId, guildSlug, questId. The listing and the runner read ONE declaration — a recipe that made a thing it cannot name is a thing no step can reach.',
      });
    });
  });

  describe('both halves at once', () => {
    it('ERROR: {undeclared and unfulfilled} => the message names both', () => {
      const error = new RecipeReturnsMismatchError({
        name: 'x',
        undeclared: ['a'],
        unfulfilled: ['b'],
        declared: ['b'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeReturnsMismatchError',
        message:
          'RECIPE RETURNS: "x" produced ids its manifest does not match. Returned but never declared: a. Declared but not returned: b. Its manifest declares: b. The listing and the runner read ONE declaration — a recipe that made a thing it cannot name is a thing no step can reach.',
      });
    });
  });

  describe('inheritance', () => {
    it('VALID: error instanceof Error => returns true', () => {
      expect(
        new RecipeReturnsMismatchError({
          name: 'x',
          undeclared: [],
          unfulfilled: [],
          declared: [],
        }) instanceof Error,
      ).toBe(true);
    });
  });
});
