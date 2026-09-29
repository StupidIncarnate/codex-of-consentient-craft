import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { questFindBySessionIdBroker } from './quest-find-by-session-id-broker';
import { questFindBySessionIdBrokerProxy } from './quest-find-by-session-id-broker.proxy';

describe('questFindBySessionIdBroker', () => {
  describe('lookup', () => {
    it('VALID: {sessionId matches chaoswhisperer workItem in single guild} => returns questId', async () => {
      const proxy = questFindBySessionIdBrokerProxy();

      const guildId = GuildIdStub({ value: '3ab9e9e0-824c-8324-bb30-e422c9d6fde8' });
      const questId = QuestIdStub({ value: 'q-sess-1' });
      const sessionId = SessionIdStub({ value: 'session-aaa-001' });

      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const chaoswhispererItem = WorkItemStub({ role: 'chaoswhisperer', sessionId });
      const quest = QuestStub({ id: questId, workItems: [chaoswhispererItem] });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questFindBySessionIdBroker({ sessionId });

      expect(result).toBe(questId);
    });

    it('EMPTY: {sessionId not present in any quest} => returns null', async () => {
      const proxy = questFindBySessionIdBrokerProxy();

      const guildId = GuildIdStub({ value: '0c22219e-994c-2530-9598-28027b317e3d' });
      const questId = QuestIdStub({ value: 'q-sess-miss-1' });
      const sessionIdInQuest = SessionIdStub({ value: 'session-bbb-002' });
      const sessionIdSought = SessionIdStub({ value: 'session-ccc-002' });

      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const chaoswhispererItem = WorkItemStub({
        role: 'chaoswhisperer',
        sessionId: sessionIdInQuest,
      });
      const quest = QuestStub({ id: questId, workItems: [chaoswhispererItem] });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questFindBySessionIdBroker({ sessionId: sessionIdSought });

      expect(result).toBe(null);
    });

    it('VALID: {sessionId matches chaoswhisperer in second guild} => returns correct questId', async () => {
      const proxy = questFindBySessionIdBrokerProxy();

      const guildIdA = GuildIdStub({ value: '4c71969e-369c-4847-97a2-02d82a79de48' });
      const guildIdB = GuildIdStub({ value: '930281e2-5d0e-87b1-ac37-deb9b5c51192' });
      const questIdA = QuestIdStub({ value: 'q-sess-a' });
      const questIdB = QuestIdStub({ value: 'q-sess-b' });
      const sessionId = SessionIdStub({ value: 'session-ddd-003' });
      const otherSessionId = SessionIdStub({ value: 'session-eee-003' });

      const guildItemA = GuildListItemStub({ id: guildIdA, valid: true });
      const guildItemB = GuildListItemStub({ id: guildIdB, valid: true });
      const questA = QuestStub({
        id: questIdA,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId: otherSessionId })],
      });
      const questB = QuestStub({
        id: questIdB,
        workItems: [WorkItemStub({ role: 'chaoswhisperer', sessionId })],
      });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItemA, guildItemB],
        questsByGuildId: [
          { guildId: guildIdA, quests: [questA] },
          { guildId: guildIdB, quests: [questB] },
        ],
      });

      const result = await questFindBySessionIdBroker({ sessionId });

      expect(result).toBe(questIdB);
    });

    it('EDGE: {chaoswhisperer workItem has no sessionId} => not matched, returns null', async () => {
      const proxy = questFindBySessionIdBrokerProxy();

      const guildId = GuildIdStub({ value: '0dd72b3d-fa42-8896-bde0-f62b86bc59f3' });
      const questId = QuestIdStub({ value: 'q-sess-nosession' });
      const sessionId = SessionIdStub({ value: 'session-fff-004' });

      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const chaoswhispererItem = WorkItemStub({ role: 'chaoswhisperer' });
      const quest = QuestStub({ id: questId, workItems: [chaoswhispererItem] });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questFindBySessionIdBroker({ sessionId });

      expect(result).toBe(null);
    });

    it('VALID: {invalid guild} => skipped during scan, returns null when no other guild has it', async () => {
      const proxy = questFindBySessionIdBrokerProxy();

      const guildId = GuildIdStub({ value: '97bc2ddc-87a2-1a66-9bcf-1f4f3a7e78f4' });
      const sessionId = SessionIdStub({ value: 'session-ggg-005' });

      const guildItem = GuildListItemStub({ id: guildId, valid: false });
      proxy.setupGuildsAndQuests({ guildItems: [guildItem], questsByGuildId: [] });

      const result = await questFindBySessionIdBroker({ sessionId });

      expect(result).toBe(null);
    });

    it('EMPTY: {no guilds} => returns null', async () => {
      const proxy = questFindBySessionIdBrokerProxy();
      proxy.setupNoGuilds();

      const sessionId = SessionIdStub({ value: 'session-hhh-006' });
      const result = await questFindBySessionIdBroker({ sessionId });

      expect(result).toBe(null);
    });

    it('EDGE: {matching sessionId on non-chaoswhisperer role} => not matched, returns null', async () => {
      const proxy = questFindBySessionIdBrokerProxy();

      const guildId = GuildIdStub({ value: 'bfeb7721-2314-30d4-b0c9-6df7f7889fd6' });
      const questId = QuestIdStub({ value: 'q-sess-wrongrole' });
      const sessionId = SessionIdStub({ value: 'session-iii-007' });

      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const codeweaverItem = WorkItemStub({ role: 'codeweaver', sessionId });
      const quest = QuestStub({ id: questId, workItems: [codeweaverItem] });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questFindBySessionIdBroker({ sessionId });

      expect(result).toBe(null);
    });
  });
});
