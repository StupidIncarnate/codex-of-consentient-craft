import { questCorruptToLegacySchemaBroker } from './quest-corrupt-to-legacy-schema-broker';
import { questCorruptToLegacySchemaBrokerProxy } from './quest-corrupt-to-legacy-schema-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questCorruptToLegacySchemaBroker', () => {
  describe('an already-written quest', () => {
    it('VALID: {record} => overwrites quest.json with a workItem carrying no role', async () => {
      const proxy = questCorruptToLegacySchemaBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const quest = QuestStub({ id: 'add-auth', folder: 'add-auth' });
      const questFilePath = `/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth/quest.json`;
      proxy.succeeds({ guild: GuildListItemStub({ id: GUILD_ID }), quest, questFilePath });

      await questCorruptToLegacySchemaBroker({ target, record: quest });

      const written = proxy.getWrittenContents({ questFilePath });

      expect(JSON.parse(String(written))).toStrictEqual({
        ...quest,
        workItems: [
          {
            id: 'corrupt-work-item',
            status: 'pending',
            spawnerType: 'agent',
            createdAt: '2024-01-15T10:00:00.000Z',
            relatedDataItems: [],
            dependsOn: [],
          },
        ],
      });
    });
  });
});
