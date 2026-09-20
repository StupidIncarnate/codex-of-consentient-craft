import { operationRemoveRouteBroker } from './operation-remove-route-broker';
import { operationRemoveRouteBrokerProxy } from './operation-remove-route-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, OperationItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('operationRemoveRouteBroker', () => {
  describe("the specification's own worked example", () => {
    it('VALID: {record: the riftcarver item} => drops only that item, leaving the rest of the ledger intact', async () => {
      const proxy = operationRemoveRouteBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const riftcarverItem = OperationItemStub({
        id: '11111111-0000-4000-8000-000000000001',
        role: 'riftcarver',
      });
      const codeweaverItem = OperationItemStub({
        id: '11111111-0000-4000-8000-000000000002',
        role: 'codeweaver',
      });
      const wardItemOne = OperationItemStub({
        id: '11111111-0000-4000-8000-000000000003',
        role: 'ward',
      });
      const flowriderItem = OperationItemStub({
        id: '11111111-0000-4000-8000-000000000004',
        role: 'flowrider',
      });
      const siegemasterItem = OperationItemStub({
        id: '11111111-0000-4000-8000-000000000005',
        role: 'siegemaster',
      });
      const wardItemTwo = OperationItemStub({
        id: '11111111-0000-4000-8000-000000000006',
        role: 'ward',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: 'add-auth',
        operations: [
          riftcarverItem,
          codeweaverItem,
          wardItemOne,
          flowriderItem,
          siegemasterItem,
          wardItemTwo,
        ],
      });
      const questFilePath = `/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth/quest.json`;
      proxy.succeeds({
        guild: GuildListItemStub({ id: GUILD_ID }),
        quest,
        questFilePath,
        outboxPath: '/tmp/dm-home/event-outbox.jsonl',
      });

      const result = await operationRemoveRouteBroker({ target, record: riftcarverItem });

      expect(result).toStrictEqual({ success: true });

      const written = proxy.getWrittenQuest({ questFilePath });

      expect(JSON.parse(String(written))).toStrictEqual({
        ...quest,
        operations: [codeweaverItem, wardItemOne, flowriderItem, siegemasterItem, wardItemTwo],
      });
    });
  });
});
