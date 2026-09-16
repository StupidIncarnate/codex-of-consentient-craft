import { guildFieldsContract } from './guild-fields-contract';
import { GuildFieldsStub } from './guild-fields.stub';

describe('guildFieldsContract', () => {
  describe('valid guild fields', () => {
    it('VALID: {name, path} => parses to exactly those two fields', () => {
      const result = guildFieldsContract.parse({
        name: 'Guild 1',
        path: '/tmp/guilds-under-test/guild-1',
      });

      expect(result).toStrictEqual({ name: 'Guild 1', path: '/tmp/guilds-under-test/guild-1' });
    });

    it('VALID: {stub with name override} => parses with the overridden name', () => {
      const result = GuildFieldsStub({ name: 'Guild 2' });

      expect(result).toStrictEqual({ name: 'Guild 2', path: '/tmp/guild-fields-stub/guild-1' });
    });

    it('VALID: {name, path, plus id/urlSlug/createdAt} => strips the record-only fields', () => {
      const result = guildFieldsContract.parse({
        name: 'Guild 1',
        path: '/tmp/guilds-under-test/guild-1',
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        urlSlug: 'guild-1',
        createdAt: '2024-01-15T10:00:00.000Z',
      });

      expect(result).toStrictEqual({ name: 'Guild 1', path: '/tmp/guilds-under-test/guild-1' });
    });
  });

  describe('invalid guild fields', () => {
    it('INVALID: {path only} => throws "Required"', () => {
      expect(() => guildFieldsContract.parse({ path: '/tmp/guilds-under-test/guild-1' })).toThrow(
        /Required/u,
      );
    });

    it('INVALID: {name only} => throws "Required"', () => {
      expect(() => guildFieldsContract.parse({ name: 'Guild 1' })).toThrow(/Required/u);
    });
  });

  describe('empty guild fields', () => {
    it('EMPTY: {} => throws "Required" for both name and path', () => {
      expect(() => guildFieldsContract.parse({})).toThrow(/Required/u);
    });
  });
});
