import { GuildNameStub } from '../../contracts/guild-name/guild-name.stub';

import { nameToUrlSlugTransformer } from './name-to-url-slug-transformer';

describe('nameToUrlSlugTransformer', () => {
  describe('basic conversions', () => {
    it('VALID: simple name => returns lowercase slug', () => {
      const name = GuildNameStub({ value: 'MyGuild' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('myguild');
    });

    it('VALID: name with spaces => returns hyphenated slug', () => {
      const name = GuildNameStub({ value: 'My Cool Guild' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('my-cool-guild');
    });

    it('VALID: name with mixed case => returns lowercase slug', () => {
      const name = GuildNameStub({ value: 'The BEST Guild' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('the-best-guild');
    });
  });

  describe('special characters', () => {
    it('VALID: name with special chars => replaces with hyphens', () => {
      const name = GuildNameStub({ value: 'My @App! v2.0' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('my-app-v2-0');
    });

    it('VALID: name with multiple consecutive special chars => collapses to single hyphen', () => {
      const name = GuildNameStub({ value: 'My --- Guild' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('my-guild');
    });

    it('VALID: name with leading special chars => trims leading hyphens', () => {
      const name = GuildNameStub({ value: '  My Guild' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('my-guild');
    });

    it('VALID: name with trailing special chars => trims trailing hyphens', () => {
      const name = GuildNameStub({ value: 'My Guild!!' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('my-guild');
    });
  });

  describe('already valid', () => {
    it('VALID: already kebab-case => returns unchanged', () => {
      const name = GuildNameStub({ value: 'my-guild' });

      const result = nameToUrlSlugTransformer({ name });

      expect(result).toBe('my-guild');
    });
  });
});
