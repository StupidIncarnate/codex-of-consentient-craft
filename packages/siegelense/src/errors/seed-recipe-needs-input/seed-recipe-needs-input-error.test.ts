import { SeedRecipeNeedsInputError } from './seed-recipe-needs-input-error';

describe('SeedRecipeNeedsInputError', () => {
  describe('a recipe with one declared input', () => {
    it('VALID: {recipeName, inputKeys: [guildId]} => names the input and a run-batch alternative bound to guild-empty', () => {
      const error = new SeedRecipeNeedsInputError({
        recipeName: 'quest-advances-one-step',
        inputKeys: ['guildId'],
      });

      expect(error.message).toBe(
        'Recipe "quest-advances-one-step" needs the input guildId, which start --seed cannot ' +
          'supply. Seed a guild first, then add a run seed step: ' +
          '[{"step":"seed","recipe":"quest-advances-one-step","params":{"guildId":"{g.guild.id}"}}] ' +
          'after [{"step":"seed","recipe":"guild-empty","as":"g"}].',
      );
    });
  });

  describe('a recipe whose declared input is a path field', () => {
    it("VALID: {recipeName, inputKeys: [guildPath]} => binds the example to guild-empty's own path field", () => {
      const error = new SeedRecipeNeedsInputError({
        recipeName: 'session-with-nested-chain',
        inputKeys: ['guildPath'],
      });

      expect(error.message).toBe(
        'Recipe "session-with-nested-chain" needs the input guildPath, which start --seed cannot ' +
          'supply. Seed a guild first, then add a run seed step: ' +
          '[{"step":"seed","recipe":"session-with-nested-chain","params":{"guildPath":"{g.guild.path}"}}] ' +
          'after [{"step":"seed","recipe":"guild-empty","as":"g"}].',
      );
    });
  });

  describe('a recipe with more than one declared input', () => {
    it('VALID: {recipeName, inputKeys: [guildId, note]} => pluralizes "inputs" and lists both, comma-joined', () => {
      const error = new SeedRecipeNeedsInputError({
        recipeName: 'two-input-recipe',
        inputKeys: ['guildId', 'note'],
      });

      expect(error.message).toBe(
        'Recipe "two-input-recipe" needs the inputs guildId, note, which start --seed cannot ' +
          'supply. Seed a guild first, then add a run seed step: ' +
          '[{"step":"seed","recipe":"two-input-recipe","params":{"guildId":"{g.guild.id}","note":"{g.guild.id}"}}] ' +
          'after [{"step":"seed","recipe":"guild-empty","as":"g"}].',
      );
    });
  });

  describe('the thrown error is named for instanceof checks', () => {
    it('VALID: {recipeName, inputKeys} => sets error.name to SeedRecipeNeedsInputError', () => {
      const error = new SeedRecipeNeedsInputError({ recipeName: 'x', inputKeys: ['guildId'] });

      expect(error.name).toBe('SeedRecipeNeedsInputError');
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof SeedRecipeNeedsInputError => returns true', () => {
      const error = new SeedRecipeNeedsInputError({ recipeName: 'x', inputKeys: ['guildId'] });

      expect(error instanceof SeedRecipeNeedsInputError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new SeedRecipeNeedsInputError({ recipeName: 'x', inputKeys: ['guildId'] });

      expect(error instanceof Error).toBe(true);
    });
  });
});
