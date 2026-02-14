import { GuildStub } from '../guild/guild.stub';
import { guildConfigContract } from './guild-config-contract';
import { GuildConfigStub } from './guild-config.stub';

describe('guildConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: empty guilds => parses successfully', () => {
      const config = GuildConfigStub();

      const result = guildConfigContract.parse(config);

      expect(result).toStrictEqual({
        guilds: [],
      });
    });

    it('VALID: config with guilds => parses successfully', () => {
      const guild = GuildStub();
      const config = GuildConfigStub({
        guilds: [guild],
      });

      const result = guildConfigContract.parse(config);

      expect(result.guilds).toStrictEqual([guild]);
    });

    it('VALID: missing guilds field => defaults to empty array', () => {
      const result = guildConfigContract.parse({});

      expect(result.guilds).toStrictEqual([]);
    });
  });

  describe('invalid configs', () => {
    it('INVALID: invalid guild in array => throws validation error', () => {
      expect(() => {
        guildConfigContract.parse({
          guilds: [{ id: 'not-a-uuid' }],
        });
      }).toThrow(/Invalid uuid/u);
    });
  });
});
