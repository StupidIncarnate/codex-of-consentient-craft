import { locationsGuildPathFindBroker } from './locations-guild-path-find-broker';
import { locationsGuildPathFindBrokerProxy } from './locations-guild-path-find-broker.proxy';
import { GuildIdStub } from '../../../contracts/guild-id/guild-id.stub';

describe('locationsGuildPathFindBroker', () => {
  describe('guild path resolution', () => {
    it('VALID: {guildId: uuid} => returns <dmHome>/guilds/<guildId>', () => {
      const proxy = locationsGuildPathFindBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupGuildPath({
        homeDir: '/home/user',
        homePath: '/home/user/.dungeonmaster',
        guildPath: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
      });

      const result = locationsGuildPathFindBroker({ guildId });

      expect(result).toBe('/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479');
    });
  });
});
