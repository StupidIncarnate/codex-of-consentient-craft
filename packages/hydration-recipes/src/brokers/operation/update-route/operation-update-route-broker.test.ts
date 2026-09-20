import { operationUpdateRouteBroker } from './operation-update-route-broker';
import { operationUpdateRouteBrokerProxy } from './operation-update-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, OperationItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('operationUpdateRouteBroker', () => {
  describe('a matched operation', () => {
    it('VALID: {record, fields: {text}} => replaces its text and leaves the rest unchanged', async () => {
      const proxy = operationUpdateRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const operation = OperationItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        role: 'ward',
        text: 'Seeded operation 1',
      });
      const quest = QuestStub({ id: 'add-auth', folder: 'add-auth', operations: [operation] });
      proxy.succeeds({
        guild: GuildListItemStub({ id: GUILD_ID }),
        quest,
        questFilePath: `/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth/quest.json`,
        outboxPath: '/tmp/dm-home/event-outbox.jsonl',
      });

      const result = await operationUpdateRouteBroker({
        target,
        record: operation,
        fields: { text: 'noop' },
      });

      expect(result).toStrictEqual({ ...operation, text: 'noop' });
    });
  });
});
