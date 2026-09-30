import { guildUniqueUrlSlugTransformer } from './guild-unique-url-slug-transformer';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';

describe('guildUniqueUrlSlugTransformer', () => {
  describe('free slug', () => {
    it('EMPTY: {name: "Guild 1", guilds: []} => returns the name slug unchanged', () => {
      const result = guildUniqueUrlSlugTransformer({
        name: GuildStub({ name: 'Guild 1' }).name,
        guilds: [],
      });

      expect(result).toBe('guild-1');
    });

    it('VALID: {name: "Guild 1", guilds hold another slug} => returns the name slug unchanged', () => {
      const result = guildUniqueUrlSlugTransformer({
        name: GuildStub({ name: 'Guild 1' }).name,
        guilds: [GuildStub({ name: 'My Guild', urlSlug: 'my-guild' })],
      });

      expect(result).toBe('guild-1');
    });
  });

  describe('taken slug', () => {
    it('VALID: {name: "Guild 1", guild-1 taken} => returns guild-1-2', () => {
      const result = guildUniqueUrlSlugTransformer({
        name: GuildStub({ name: 'Guild 1' }).name,
        guilds: [GuildStub({ name: GuildStub({ name: 'Guild 1' }).name, urlSlug: 'guild-1' })],
      });

      expect(result).toBe('guild-1-2');
    });

    it('VALID: {name: "Guild 1", guild-1 and guild-1-2 taken} => returns guild-1-3', () => {
      const result = guildUniqueUrlSlugTransformer({
        name: GuildStub({ name: 'Guild 1' }).name,
        guilds: [
          GuildStub({ name: GuildStub({ name: 'Guild 1' }).name, urlSlug: 'guild-1' }),
          GuildStub({ name: GuildStub({ name: 'Guild 1' }).name, urlSlug: 'guild-1-2' }),
        ],
      });

      expect(result).toBe('guild-1-3');
    });

    it('VALID: {name: "My App", slug taken by a guild of a different name} => returns my-app-2', () => {
      const result = guildUniqueUrlSlugTransformer({
        name: GuildStub({ name: 'My App' }).name,
        guilds: [GuildStub({ name: 'my app!', urlSlug: 'my-app' })],
      });

      expect(result).toBe('my-app-2');
    });

    it('EDGE: {name: "Guild 1", a registered guild without urlSlug named "Guild 1"} => counts its derived slug and returns guild-1-2', () => {
      const { urlSlug: _omitted, ...slugless } = GuildStub({ name: 'Guild 1' });

      const result = guildUniqueUrlSlugTransformer({
        name: GuildStub({ name: 'Guild 1' }).name,
        guilds: [slugless],
      });

      expect(result).toBe('guild-1-2');
    });
  });
});
