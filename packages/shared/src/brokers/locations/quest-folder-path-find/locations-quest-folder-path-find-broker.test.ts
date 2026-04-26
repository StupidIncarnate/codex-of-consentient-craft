import { locationsQuestFolderPathFindBroker } from './locations-quest-folder-path-find-broker';
import { locationsQuestFolderPathFindBrokerProxy } from './locations-quest-folder-path-find-broker.proxy';
import { GuildIdStub } from '../../../contracts/guild-id/guild-id.stub';
import { QuestIdStub } from '../../../contracts/quest-id/quest-id.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsQuestFolderPathFindBroker', () => {
  describe('quest folder path resolution', () => {
    it('VALID: {guildId, questId} => returns <dmHome>/guilds/<guildId>/quests/<questId>', () => {
      const proxy = locationsQuestFolderPathFindBrokerProxy();
      const guildId = GuildIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupQuestFolderPath({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
        guildPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479',
        }),
        guildQuestsPath: FilePathStub({
          value: '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests',
        }),
        questFolderPath: FilePathStub({
          value:
            '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests/add-auth',
        }),
      });

      const result = locationsQuestFolderPathFindBroker({ guildId, questId });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value:
            '/home/user/.dungeonmaster/guilds/f47ac10b-58cc-4372-a567-0e02b2c3d479/quests/add-auth',
        }),
      );
    });
  });
});
