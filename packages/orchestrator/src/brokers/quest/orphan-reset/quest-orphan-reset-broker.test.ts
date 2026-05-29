import {
  AgentIdStub,
  GuildIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { IsoTimestampStub } from '../../../contracts/iso-timestamp/iso-timestamp.stub';
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

  describe('clears stale per-run identity', () => {
    it('VALID: {in_progress work item carries sessionId+agentId+startedAt} => orphan reset writes quest.json with those fields removed', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000005' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'q-clear-fields' });
      const workItemId = QuestWorkItemIdStub({ value: '99999999-9999-9999-9999-000000000001' });
      const orphan = WorkItemStub({
        id: workItemId,
        status: 'in_progress',
        sessionId: SessionIdStub({ value: 'a552a01482d154100' }),
        agentId: AgentIdStub({ value: 'a552a01482d154100' }),
        startedAt: IsoTimestampStub({ value: '2026-05-26T18:25:47.328Z' }),
      });
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

      await questOrphanResetBroker();

      const persistedQuest = proxy.getLastPersistedQuest();
      const [persistedWorkItem] = persistedQuest.workItems;

      const {
        sessionId: _droppedSessionId,
        agentId: _droppedAgentId,
        startedAt: _droppedStartedAt,
        status: _replacedStatus,
        ...orphanWithoutClearedFields
      } = orphan;

      expect(persistedWorkItem).toStrictEqual({
        ...orphanWithoutClearedFields,
        status: 'pending',
      });
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

  describe('excludeSessionId', () => {
    it('VALID: {in_progress workItem with sessionId matching excludeSessionId} => preserved, returns orphansReset: 0', async () => {
      // Quest-driven watcher invariant: when the reactor starts a watcher for sessionId X,
      // the workItem that triggered the start is stamped with sessionId X and status
      // in_progress. The reset must NOT clear that stamp, or the reactor oscillates
      // start→reset→stop→start indefinitely.
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000006' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const liveSessionId = SessionIdStub({ value: 'b1b1b1b1-b1b1-4b1b-8b1b-b1b1b1b1b1b1' });
      const livePresentItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '77777777-7777-4777-8777-000000000001' }),
        status: 'in_progress',
        sessionId: liveSessionId,
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-exclude-live' }),
        status: 'in_progress',
        workItems: [livePresentItem],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });

      const result = await questOrphanResetBroker({ excludeSessionId: liveSessionId });

      expect(result).toStrictEqual({ orphansReset: 0 });
    });

    it('VALID: {one excluded live item + one orphan with different sessionId} => only the orphan is reset', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000007' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const liveSessionId = SessionIdStub({ value: 'c2c2c2c2-c2c2-4c2c-8c2c-c2c2c2c2c2c2' });
      const orphanSessionId = SessionIdStub({ value: 'd3d3d3d3-d3d3-4d3d-8d3d-d3d3d3d3d3d3' });
      const liveItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '66666666-6666-4666-8666-000000000001' }),
        status: 'in_progress',
        sessionId: liveSessionId,
      });
      const orphanItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '66666666-6666-4666-8666-000000000002' }),
        status: 'in_progress',
        sessionId: orphanSessionId,
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-mixed' }),
        status: 'in_progress',
        workItems: [liveItem, orphanItem],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      proxy.setupModifyForQuest({ quest });

      const result = await questOrphanResetBroker({ excludeSessionId: liveSessionId });

      expect(result).toStrictEqual({ orphansReset: 1 });
    });
  });
});
