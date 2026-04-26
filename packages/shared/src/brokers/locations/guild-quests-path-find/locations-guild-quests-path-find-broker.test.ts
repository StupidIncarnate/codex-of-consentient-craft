import { locationsGuildQuestsPathFindBroker } from './locations-guild-quests-path-find-broker';
import { locationsGuildQuestsPathFindBrokerProxy } from './locations-guild-quests-path-find-broker.proxy';
import { GuildIdStub } from '../../../contracts/guild-id/guild-id.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsGuildQuestsPathFindBroker', () => {
  describe('guild quests path resolution', () => {
    it('VALID: {guildId: uuid} => returns <dmHome>/guilds/<guildId>/quests', () => {
      const proxy = locationsGuildQuestsPathFindBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      proxy.setupGuildQuestsPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
        guildQuestsPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
        }),
      });

      const result = locationsGuildQuestsPathFindBroker({ guildId });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
        }),
      );
    });
  });
});
