import {
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questOrphanResetBroker } from './quest-orphan-reset-broker';
import { questOrphanResetBrokerProxy } from './quest-orphan-reset-broker.proxy';

describe('questOrphanResetBroker', () => {
  describe('no orphans', () => {
    it('EMPTY: {no guilds} => returns orphansReset: 0', async () => {
      const proxy = questOrphanResetBrokerProxy();
      proxy.setupGuildsAndQuests({ guildItems: [], questsByGuildId: [] });

      const result = await questOrphanResetBroker();

      expect(result).toStrictEqual({ orphansReset: 0 });
    });

    it('VALID: {approved quest with all pending work items} => returns orphansReset: 0', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000001' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'q-noorphan' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        workItems: [WorkItemStub({ status: 'pending' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questOrphanResetBroker();

      expect(result).toStrictEqual({ orphansReset: 0 });
    });
  });

  describe('orphans present', () => {
    it('VALID: {in_progress quest with one in_progress work item} => resets and returns orphansReset: 1', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000002' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'q-orphan-1' });
      const workItemId = QuestWorkItemIdStub({ value: '88888888-8888-8888-8888-000000000001' });
      const orphan = WorkItemStub({ id: workItemId, status: 'in_progress' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [orphan],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      proxy.setupModifyForQuest({ quest });

      const result = await questOrphanResetBroker();

      expect(result).toStrictEqual({ orphansReset: 1 });
    });

    it('VALID: {two quests each with one orphan} => returns orphansReset: 2', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000003' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questA = QuestStub({
        id: QuestIdStub({ value: 'q-orphan-a' }),
        status: 'in_progress',
        workItems: [WorkItemStub({ status: 'in_progress' })],
      });
      const questB = QuestStub({
        id: QuestIdStub({ value: 'q-orphan-b' }),
        status: 'in_progress',
        workItems: [WorkItemStub({ status: 'in_progress' })],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [questA, questB] }],
      });
      proxy.setupModifyForQuest({ quest: questA });
      proxy.setupModifyForQuest({ quest: questB });

      const result = await questOrphanResetBroker();

      expect(result).toStrictEqual({ orphansReset: 2 });
    });
  });

  describe('invalid guild handling', () => {
    it('VALID: {invalid guild} => skipped, returns 0', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000004' });
      const guildItem = GuildListItemStub({ id: guildId, valid: false });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [],
      });

      const result = await questOrphanResetBroker();

      expect(result).toStrictEqual({ orphansReset: 0 });
    });
  });
});
