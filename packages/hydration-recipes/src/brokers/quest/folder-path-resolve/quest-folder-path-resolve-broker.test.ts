import { questFolderPathResolveBroker } from './quest-folder-path-resolve-broker';
import { questFolderPathResolveBrokerProxy } from './quest-folder-path-resolve-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questFolderPathResolveBroker', () => {
  describe('a quest whose guild is found', () => {
    it('VALID: {record} => returns <home>/guilds/<guildId>/quests/<folder>', async () => {
      const proxy = questFolderPathResolveBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const record = QuestStub({ id: 'add-auth', folder: 'add-auth' });
      proxy.succeeds({ guild: GuildListItemStub({ id: GUILD_ID }), quest: record });

      const result = await questFolderPathResolveBroker({ target, record });

      expect(result).toBe(`/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth`);
    });
  });
});
