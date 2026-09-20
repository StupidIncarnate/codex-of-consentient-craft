import { SeedBindingUnknownError } from './seed-binding-unknown-error';

describe('SeedBindingUnknownError', () => {
  describe('an unbound name', () => {
    it('ERROR: {no bindings yet} => the message says nothing has been bound', () => {
      const error = new SeedBindingUnknownError({
        placeholder: '{g.guildSlug}',
        binding: 'g',
        knownBindings: [],
        knownFields: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'SeedBindingUnknownError',
        message:
          'UNKNOWN BINDING: {g.guildSlug} cannot be resolved — no `seed` step in this batch has bound anything yet. A binding is minted by a { "step": "seed", "recipe": "…", "as": "g" } EARLIER IN THIS BATCH, and lives only for that batch. Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody meant.',
      });
    });

    it('ERROR: {other bindings exist} => the message lists them', () => {
      const error = new SeedBindingUnknownError({
        placeholder: '{q.questId}',
        binding: 'q',
        knownBindings: ['g', 's'],
        knownFields: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'SeedBindingUnknownError',
        message:
          'UNKNOWN BINDING: {q.questId} cannot be resolved — bound in this batch: g, s. A binding is minted by a { "step": "seed", "recipe": "…", "as": "q" } EARLIER IN THIS BATCH, and lives only for that batch. Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody meant.',
      });
    });
  });

  describe('a bound name with an unknown field', () => {
    it('ERROR: {g bound, guildSlugg asked for} => the message lists what g holds', () => {
      const error = new SeedBindingUnknownError({
        placeholder: '{g.guildSlugg}',
        binding: 'g',
        knownBindings: ['g'],
        knownFields: ['guildId', 'guildSlug', 'questId'],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'SeedBindingUnknownError',
        message:
          'UNKNOWN BINDING: {g.guildSlugg} cannot be resolved — bound in this batch: g. "g" holds: guildId, guildSlug, questId. A binding is minted by a { "step": "seed", "recipe": "…", "as": "g" } EARLIER IN THIS BATCH, and lives only for that batch. Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody meant.',
      });
    });

    it('EMPTY: {a binding holding nothing} => the message says so', () => {
      const error = new SeedBindingUnknownError({
        placeholder: '{g.x}',
        binding: 'g',
        knownBindings: ['g'],
        knownFields: [],
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'SeedBindingUnknownError',
        message:
          'UNKNOWN BINDING: {g.x} cannot be resolved — bound in this batch: g. "g" holds: (nothing). A binding is minted by a { "step": "seed", "recipe": "…", "as": "g" } EARLIER IN THIS BATCH, and lives only for that batch. Nothing is interpolated as a literal: a placeholder that survived would become a URL nobody meant.',
      });
    });
  });

  describe('inheritance', () => {
    it('VALID: error instanceof Error => returns true', () => {
      const error = new SeedBindingUnknownError({
        placeholder: '{g.x}',
        binding: 'g',
        knownBindings: [],
        knownFields: null,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
