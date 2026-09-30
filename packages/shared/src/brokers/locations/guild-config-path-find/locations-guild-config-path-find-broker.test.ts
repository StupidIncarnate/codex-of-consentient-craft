import { locationsGuildConfigPathFindBroker } from './locations-guild-config-path-find-broker';
import { locationsGuildConfigPathFindBrokerProxy } from './locations-guild-config-path-find-broker.proxy';
import { GuildIdStub } from '../../../contracts/guild-id/guild-id.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsGuildConfigPathFindBroker', () => {
  describe('guild config path resolution', () => {
    it('VALID: {guildId: uuid} => returns <dmHome>/guilds/<guildId>/guild.json', () => {
      const proxy = locationsGuildConfigPathFindBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupGuildConfigPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        guildPath: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        guildConfigPath: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/guild.json',
      });

      const result = locationsGuildConfigPathFindBroker({ guildId });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/guild.json',
        }),
      );
    });
  });
});
