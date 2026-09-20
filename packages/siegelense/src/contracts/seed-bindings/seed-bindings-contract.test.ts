import { seedBindingsContract } from './seed-bindings-contract';
import { SeedBindingsStub } from './seed-bindings.stub';

describe('seedBindingsContract', () => {
  describe('valid bindings', () => {
    it('VALID: {one binding} => parses to the complete map', () => {
      expect(SeedBindingsStub()).toStrictEqual({
        g: {
          guildId: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
          guildSlug: 'siege-guild',
          questId: 'bbbbbbbb-2222-4222-8222-222222222222',
        },
      });
    });

    it('VALID: {two bindings, one with a dotted return name} => parses both', () => {
      expect(
        seedBindingsContract.parse({
          g: { guildSlug: 'siege-guild' },
          s: { 'sessions.nested': '/siege-guild/session/s1' },
        }),
      ).toStrictEqual({
        g: { guildSlug: 'siege-guild' },
        s: { 'sessions.nested': '/siege-guild/session/s1' },
      });
    });

    it('EMPTY: {} => parses to an empty map, which is a batch that has not seeded yet', () => {
      expect(seedBindingsContract.parse({})).toStrictEqual({});
    });
  });

  describe('invalid bindings', () => {
    it('INVALID: {a binding name with a dot} => throws naming the identifier rule', () => {
      expect(() => seedBindingsContract.parse({ 'g.x': { a: 'b' } })).toThrow(
        /A seed binding name is a bare identifier/u,
      );
    });

    it('INVALID: {a non-string id} => throws', () => {
      expect(() => seedBindingsContract.parse({ g: { guildSlug: 3 } })).toThrow(/Expected string/u);
    });
  });
});
