import { RecipeResultStub } from '@dungeonmaster/siegelense-recipes/contracts';

import { seedResultRenderTransformer } from './seed-result-render-transformer';

describe('seedResultRenderTransformer', () => {
  describe('rendering', () => {
    it('VALID: {the production recipe result} => renders every id it made', () => {
      const result = seedResultRenderTransformer({
        result: RecipeResultStub({
          guildId: '7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41',
          guildSlug: 'siege-guild',
          questId: 'bbbbbbbb-2222-4222-8222-222222222222',
        }),
      });

      expect(result).toBe(
        '{"guildId":"7306b468-0f2d-4a5e-9c3b-2d1e8f0a6b41","guildSlug":"siege-guild","questId":"bbbbbbbb-2222-4222-8222-222222222222"}',
      );
    });

    it('VALID: {a dotted return name} => the key is printed with its dot, the form a placeholder reads', () => {
      const result = seedResultRenderTransformer({
        result: RecipeResultStub({
          guildId: 'ignored',
          guildSlug: 'siege-guild',
          'sessions.nested': '/siege-guild/session/sess-1',
        }),
      });

      expect(result).toBe(
        '{"guildId":"ignored","guildSlug":"siege-guild","sessions.nested":"/siege-guild/session/sess-1"}',
      );
    });

    it('EMPTY: {a recipe that returned nothing} => renders an empty object', () => {
      expect(seedResultRenderTransformer({ result: {} })).toBe('{}');
    });
  });
});
