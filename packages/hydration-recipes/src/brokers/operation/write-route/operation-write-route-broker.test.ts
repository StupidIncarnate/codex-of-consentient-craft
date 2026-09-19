import { operationWriteRouteBroker } from './operation-write-route-broker';
import { operationWriteRouteBrokerProxy } from './operation-write-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, OperationItemIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('operationWriteRouteBroker', () => {
  describe('a quest with no operations yet', () => {
    it('VALID: {text, role, status, questId} => appends the item and returns it', async () => {
      const proxy = operationWriteRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const quest = QuestStub({ id: 'add-auth', folder: 'add-auth', operations: [] });
      const mintedId = OperationItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.succeeds({
        quest,
        guild: GuildListItemStub({ id: GUILD_ID }),
        questFilePath: `/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth/quest.json`,
        outboxPath: '/tmp/dm-home/event-outbox.jsonl',
        mintedId,
      });

      const result = await operationWriteRouteBroker({
        target,
        fields: {
          text: 'Seeded operation 1',
          role: 'codeweaver',
          status: 'pending',
          questId: 'add-auth',
          guildId: GUILD_ID,
        },
      });

      expect(result).toStrictEqual({
        id: mintedId,
        text: 'Seeded operation 1',
        role: 'codeweaver',
        status: 'pending',
        locked: false,
        flowIds: [],
        packageNames: [],
      });
    });
  });
});
