import {
  AbsoluteFilePathStub,
  FilePathStub,
  GuildIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { locationsCitationQuestFilePathFindBroker } from './locations-citation-quest-file-path-find-broker';
import { locationsCitationQuestFilePathFindBrokerProxy } from './locations-citation-quest-file-path-find-broker.proxy';

const HOME = '/home/user/.dungeonmaster';
const GUILD_A = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const GUILD_B = '12345678-1234-4234-8234-123456789abc';

describe('locationsCitationQuestFilePathFindBroker', () => {
  describe('quest file resolution', () => {
    it('VALID: {guildId, questId} => the quest folder with quest.json appended', () => {
      const proxy = locationsCitationQuestFilePathFindBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: `${HOME}/guilds/${GUILD_A}` }),
        guildQuestsPath: FilePathStub({ value: `${HOME}/guilds/${GUILD_A}/quests` }),
        questFolderPath: FilePathStub({ value: `${HOME}/guilds/${GUILD_A}/quests/quest-1` }),
      });

      const result = locationsCitationQuestFilePathFindBroker({
        guildId: GuildIdStub({ value: GUILD_A }),
        questId: QuestIdStub({ value: 'quest-1' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: `${HOME}/guilds/${GUILD_A}/quests/quest-1/quest.json`,
        }),
      );
    });

    it('EDGE: {a quest folder with a trailing separator} => joined without a double slash', () => {
      const proxy = locationsCitationQuestFilePathFindBrokerProxy();
      proxy.setupQuestFolder({
        homeDir: '/home/user',
        homePath: FilePathStub({ value: HOME }),
        guildPath: FilePathStub({ value: `${HOME}/guilds/${GUILD_B}` }),
        guildQuestsPath: FilePathStub({ value: `${HOME}/guilds/${GUILD_B}/quests` }),
        questFolderPath: FilePathStub({ value: `${HOME}/guilds/${GUILD_B}/quests/quest-2/` }),
      });

      const result = locationsCitationQuestFilePathFindBroker({
        guildId: GuildIdStub({ value: GUILD_B }),
        questId: QuestIdStub({ value: 'quest-2' }),
      });

      expect(result).toBe(
        AbsoluteFilePathStub({
          value: `${HOME}/guilds/${GUILD_B}/quests/quest-2/quest.json`,
        }),
      );
    });
  });
});
