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

      const guildId = GuildIdStub({ value: '3ab9e9e0-824c-8324-bb30-e422c9d6fde8' });
      const questId = QuestIdStub({ value: 'q-find-1' });
      const workItemId = QuestWorkItemIdStub({ value: '5e53aa99-aec7-4755-bbe4-fce5d66ba869' });

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

      const guildId = GuildIdStub({ value: '0c22219e-994c-2530-9598-28027b317e3d' });
      const questId = QuestIdStub({ value: 'q-miss-1' });
      const workItemIdInQuest = QuestWorkItemIdStub({
        value: 'fe100de3-264e-2601-ad3e-cfcfc88b6199',
      });
      const workItemIdSought = QuestWorkItemIdStub({
        value: 'af0aa296-51f9-21a4-a35b-e0eb00ca8dbb',
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

      const guildIdA = GuildIdStub({ value: '4c71969e-369c-4847-97a2-02d82a79de48' });
      const guildIdB = GuildIdStub({ value: '930281e2-5d0e-87b1-ac37-deb9b5c51192' });
      const questIdA = QuestIdStub({ value: 'q-find-a' });
      const questIdB = QuestIdStub({ value: 'q-find-b' });
      const workItemId = QuestWorkItemIdStub({ value: '5be68fa8-eb1e-59ff-a4f9-6fe83ccd819f' });
      const otherWorkItemId = QuestWorkItemIdStub({
        value: '0ddfc89e-8733-7e36-abc3-edbf02f72aa8',
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

      const guildId = GuildIdStub({ value: '0dd72b3d-fa42-8896-bde0-f62b86bc59f3' });
      const workItemId = QuestWorkItemIdStub({ value: '01732bd5-a614-805d-b866-007ef7e4b7ba' });

      const guildItem = GuildListItemStub({ id: guildId, valid: false });
      proxy.setupGuildsAndQuests({ guildItems: [guildItem], questsByGuildId: [] });

      const result = await questFindByWorkItemIdBroker({ workItemId });

      expect(result).toBe(null);
    });
  });

  describe('re-reads on every call', () => {
    it('VALID: {work item present, then gone from the quest} => second call re-reads and returns null instead of the stale first answer', async () => {
      const proxy = questFindByWorkItemIdBrokerProxy();

      const guildId = GuildIdStub({ value: 'f247ff35-5e87-634d-a568-ff4fd4e3824c' });
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
