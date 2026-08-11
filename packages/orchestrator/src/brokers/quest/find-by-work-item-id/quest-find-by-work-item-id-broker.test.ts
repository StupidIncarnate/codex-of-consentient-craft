import {
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questFindByWorkItemIdBroker } from './quest-find-by-work-item-id-broker';
import { questFindByWorkItemIdBrokerProxy } from './quest-find-by-work-item-id-broker.proxy';

describe('questFindByWorkItemIdBroker', () => {
  describe('lookup', () => {
    it('VALID: {workItemId found in single quest in single guild} => returns that questId', async () => {
      const proxy = questFindByWorkItemIdBrokerProxy();

      const guildId = GuildIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000001' });
      const questId = QuestIdStub({ value: 'q-find-1' });
      const workItemId = QuestWorkItemIdStub({ value: '11111111-1111-1111-1111-000000000001' });

      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const workItem = WorkItemStub({ id: workItemId });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questFindByWorkItemIdBroker({ workItemId });

      expect(result).toBe(questId);
    });

    it('EMPTY: {workItemId not present in any quest} => returns null', async () => {
      const proxy = questFindByWorkItemIdBrokerProxy();

      const guildId = GuildIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000002' });
      const questId = QuestIdStub({ value: 'q-miss-1' });
      const workItemIdInQuest = QuestWorkItemIdStub({
        value: '22222222-2222-2222-2222-000000000099',
      });
      const workItemIdSought = QuestWorkItemIdStub({
        value: '33333333-3333-3333-3333-000000000099',
      });

      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const workItem = WorkItemStub({ id: workItemIdInQuest });
      const quest = QuestStub({ id: questId, workItems: [workItem] });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questFindByWorkItemIdBroker({ workItemId: workItemIdSought });

      expect(result).toBe(null);
    });

    it('VALID: {workItemId found in second guild} => returns the right questId', async () => {
      const proxy = questFindByWorkItemIdBrokerProxy();

      const guildIdA = GuildIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000003' });
      const guildIdB = GuildIdStub({ value: 'bbbbbbbb-bbbb-bbbb-bbbb-000000000003' });
      const questIdA = QuestIdStub({ value: 'q-find-a' });
      const questIdB = QuestIdStub({ value: 'q-find-b' });
      const workItemId = QuestWorkItemIdStub({ value: '44444444-4444-4444-4444-000000000003' });
      const otherWorkItemId = QuestWorkItemIdStub({
        value: '55555555-5555-5555-5555-000000000003',
      });

      const guildItemA = GuildListItemStub({ id: guildIdA, valid: true });
      const guildItemB = GuildListItemStub({ id: guildIdB, valid: true });
      const questA = QuestStub({
        id: questIdA,
        workItems: [WorkItemStub({ id: otherWorkItemId })],
      });
      const questB = QuestStub({
        id: questIdB,
        workItems: [WorkItemStub({ id: workItemId })],
      });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItemA, guildItemB],
        questsByGuildId: [
          { guildId: guildIdA, quests: [questA] },
          { guildId: guildIdB, quests: [questB] },
        ],
      });

      const result = await questFindByWorkItemIdBroker({ workItemId });

      expect(result).toBe(questIdB);
    });

    it('VALID: {invalid guild} => skipped during scan, returns null when no other guild has it', async () => {
      const proxy = questFindByWorkItemIdBrokerProxy();

      const guildId = GuildIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000004' });
      const workItemId = QuestWorkItemIdStub({ value: '66666666-6666-6666-6666-000000000004' });

      const guildItem = GuildListItemStub({ id: guildId, valid: false });
      proxy.setupGuildsAndQuests({ guildItems: [guildItem], questsByGuildId: [] });

      const result = await questFindByWorkItemIdBroker({ workItemId });

      expect(result).toBe(null);
    });
  });

  describe('re-reads on every call', () => {
    it('VALID: {work item present, then gone from the quest} => second call re-reads and returns null instead of the stale first answer', async () => {
      const proxy = questFindByWorkItemIdBrokerProxy();

      const guildId = GuildIdStub({ value: 'aaaaaaaa-aaaa-aaaa-aaaa-000000000006' });
      const questId = QuestIdStub({ value: 'q-stale' });
      const workItemId = QuestWorkItemIdStub({ value: '88888888-8888-8888-8888-000000000006' });

      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questWithWorkItem = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ id: workItemId })],
      });
      const questWithoutWorkItem = QuestStub({ id: questId, workItems: [] });

      proxy.setupGuildsAndQuestsOnce({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [questWithWorkItem] }],
      });
      proxy.setupGuildsAndQuestsOnce({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [questWithoutWorkItem] }],
      });

      const first = await questFindByWorkItemIdBroker({ workItemId });
      const second = await questFindByWorkItemIdBroker({ workItemId });

      expect(first).toBe(questId);
      expect(second).toBe(null);
    });
  });
});
