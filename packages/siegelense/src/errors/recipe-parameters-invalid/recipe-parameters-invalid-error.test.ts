import { RecipeParametersInvalidError } from './recipe-parameters-invalid-error';

describe('RecipeParametersInvalidError', () => {
  describe('a missing required parameter', () => {
    it('ERROR: {missing: [guild]} => the message names it and what the recipe declares', () => {
      const error = new RecipeParametersInvalidError({
        name: 'session-with-nested-subagent',
        missing: ['guild'],
        unknown: [],
        declared: ['guild'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeParametersInvalidError',
        message:
          'RECIPE PARAMETERS: "session-with-nested-subagent" was called with parameters it cannot take. Missing: guild. It declares: guild. Parameters are written as top-level keys on the step — { "step": "seed", "recipe": "session-with-nested-subagent", "guild": "{g.guildId}", "as": "s" }.',
      });
    });
  });

  describe('an unknown parameter', () => {
    it('ERROR: {unknown: [gild]} => the message names the typo', () => {
      const error = new RecipeParametersInvalidError({
        name: 'session-with-nested-subagent',
        missing: [],
        unknown: ['gild'],
        declared: ['guild'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeParametersInvalidError',
        message:
          'RECIPE PARAMETERS: "session-with-nested-subagent" was called with parameters it cannot take. Not a parameter of this recipe: gild. It declares: guild. Parameters are written as top-level keys on the step — { "step": "seed", "recipe": "session-with-nested-subagent", "guild": "{g.guildId}", "as": "s" }.',
      });
    });
  });

  describe('a recipe that takes none', () => {
    it('EMPTY: {declared: []} => the message says the recipe takes none', () => {
      const error = new RecipeParametersInvalidError({
        name: 'guild-with-three-quests',
        missing: [],
        unknown: ['guild'],
        declared: [],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'RecipeParametersInvalidError',
        message:
          'RECIPE PARAMETERS: "guild-with-three-quests" was called with parameters it cannot take. Not a parameter of this recipe: guild. It declares: (none). Parameters are written as top-level keys on the step — { "step": "seed", "recipe": "guild-with-three-quests", "guild": "{g.guildId}", "as": "s" }.',
      });
    });
  });

  describe('inheritance', () => {
    it('VALID: error instanceof Error => returns true', () => {
      expect(
        new RecipeParametersInvalidError({
          name: 'x',
          missing: [],
          unknown: [],
          declared: [],
        }) instanceof Error,
      ).toBe(true);
    });
  });
});
