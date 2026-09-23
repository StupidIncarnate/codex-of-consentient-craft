import { questWorkItemAttachBroker } from './quest-work-item-attach-broker';
import { questWorkItemAttachBrokerProxy } from './quest-work-item-attach-broker.proxy';
import { DmTargetStub } from '../../../contracts/dm-target/dm-target.stub';
import { GuildListItemStub, QuestStub, QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts';
import type { StubArgument } from '@dungeonmaster/shared/@types';

const GUILD_ID = '11111111-1111-4111-8111-111111111111';

describe('questWorkItemAttachBroker', () => {
  describe('a quest with no work items yet', () => {
    it('VALID: {role, status, spawnerType, createdAt, operationId} => appends the item, naming the operation in relatedDataItems', async () => {
      const proxy = questWorkItemAttachBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const quest = QuestStub({ id: 'add-auth', folder: 'add-auth', workItems: [] });
      const mintedId = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      proxy.succeeds({
        quest,
        guild: GuildListItemStub({ id: GUILD_ID }),
        questFilePath: `/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth/quest.json`,
        outboxPath: '/tmp/dm-home/event-outbox.jsonl',
        mintedId,
      });

      const result = await questWorkItemAttachBroker({
        target,
        record: quest,
        args: {
          role: 'codeweaver',
          status: 'complete',
          spawnerType: 'agent',
          createdAt: '2024-01-01T00:00:00.000Z',
          operationId: '00000000-0000-4000-8000-000000000201',
        },
      });

      expect(result).toStrictEqual({
        id: mintedId,
        role: 'codeweaver',
        status: 'complete',
        spawnerType: 'agent',
        createdAt: '2024-01-01T00:00:00.000Z',
        relatedDataItems: ['operations/00000000-0000-4000-8000-000000000201'],
        dependsOn: [],
        attempt: 0,
        maxAttempts: 1,
        retryCount: 0,
        observations: [],
        assignedUnitIds: [],
      });
    });

    it('VALID: {role, status, spawnerType, createdAt, operationId} => persists the quest with the new item appended onto workItems', async () => {
      const proxy = questWorkItemAttachBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const quest = QuestStub({ id: 'add-auth', folder: 'add-auth', workItems: [] });
      const mintedId = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const questFilePath = `/tmp/dm-home/guilds/${GUILD_ID}/quests/add-auth/quest.json`;
      proxy.succeeds({
        quest,
        guild: GuildListItemStub({ id: GUILD_ID }),
        questFilePath,
        outboxPath: '/tmp/dm-home/event-outbox.jsonl',
        mintedId,
      });

      await questWorkItemAttachBroker({
        target,
        record: quest,
        args: {
          role: 'ward',
          status: 'complete',
          spawnerType: 'command',
          createdAt: '2024-01-01T00:00:00.000Z',
          operationId: '00000000-0000-4000-8000-000000000202',
        },
      });

      const writtenJson = JSON.parse(
        String(proxy.getWrittenContents({ questFilePath })),
      ) as StubArgument<ReturnType<typeof QuestStub>>;
      const writtenQuest = QuestStub(writtenJson);

      expect(writtenQuest.workItems.map((workItem) => workItem.relatedDataItems)).toStrictEqual([
        ['operations/00000000-0000-4000-8000-000000000202'],
      ]);
    });
  });

  describe('the quest is not found', () => {
    it('ERROR: {quest that questGetBroker cannot find} => throws naming the quest id', async () => {
      const proxy = questWorkItemAttachBrokerProxy();
      const target = DmTargetStub({ home: '/tmp/dm-home', claudeHome: '/tmp/dm-home' });
      const quest = QuestStub({ id: 'missing-quest', folder: 'missing-quest' });
      proxy.setupQuestNotFound({ questId: quest.id });

      await expect(
        questWorkItemAttachBroker({
          target,
          record: quest,
          args: {
            role: 'codeweaver',
            status: 'complete',
            spawnerType: 'agent',
            createdAt: '2024-01-01T00:00:00.000Z',
            operationId: '00000000-0000-4000-8000-000000000201',
          },
        }),
      ).rejects.toThrow(/questWorkItemAttachBroker: quest missing-quest not found/u);
    });
  });
});
