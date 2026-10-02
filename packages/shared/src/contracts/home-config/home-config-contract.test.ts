import { GuildStub } from '../guild/guild.stub';
import { homeConfigContract } from './home-config-contract';
import { HomeConfigStub } from './home-config.stub';

describe('homeConfigContract', () => {
  describe('valid configs', () => {
    it('VALID: empty guilds => parses successfully', () => {
      const config = HomeConfigStub();

      const result = homeConfigContract.parse(config);

      expect(result).toStrictEqual({
        guilds: [],
      });
    });

    it('VALID: config with guilds => parses successfully', () => {
      const guild = GuildStub();
      const config = HomeConfigStub({
        guilds: [guild],
      });

      const result = homeConfigContract.parse(config);

      expect(result.guilds).toStrictEqual([guild]);
    });

    it('VALID: missing guilds field => defaults to empty array', () => {
      const result = homeConfigContract.parse({});

      expect(result.guilds).toStrictEqual([]);
    });
  });

  describe('invalid configs', () => {
    it('INVALID: invalid guild in array => throws validation error', () => {
      expect(() => {
        homeConfigContract.parse({
          guilds: [{ id: 'not-a-uuid' }],
        });
      }).toThrow(/Invalid UUID/u);
    });
  });
});
