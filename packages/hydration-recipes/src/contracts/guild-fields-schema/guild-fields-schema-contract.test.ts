import { guildFieldsContract } from '../guild-fields/guild-fields-contract';
import { guildFieldsSchemaContract } from './guild-fields-schema-contract';
import { GuildFieldsSchemaStub } from './guild-fields-schema.stub';

describe('guildFieldsSchemaContract', () => {
  describe('identity with guildFieldsContract', () => {
    it('VALID: {} => is the exact same schema instance, never a re-implementation', () => {
      expect(guildFieldsSchemaContract).toBe(guildFieldsContract);
    });
  });

  describe('valid guild fields', () => {
    it('VALID: {name, path} => parses identically to guildFieldsContract', () => {
      const result = guildFieldsSchemaContract.parse({
        name: 'Guild 1',
        path: '/tmp/guilds-under-test/guild-1',
      });

      expect(result).toStrictEqual(GuildFieldsSchemaStub({}));
    });
  });

  describe('invalid guild fields', () => {
    it('INVALID: {path only} => throws "Required"', () => {
      expect(() =>
        guildFieldsSchemaContract.parse({ path: '/tmp/guilds-under-test/guild-1' }),
      ).toThrow(/Required/u);
    });
  });

  describe('empty guild fields', () => {
    it('EMPTY: {} => throws "Required"', () => {
      expect(() => guildFieldsSchemaContract.parse({})).toThrow(/Required/u);
    });
  });
});
