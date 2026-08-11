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

    it('VALID: {one quest with two orphans, one quest with none} => returns orphansReset: 2 and writes both resets', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000003' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      // Two orphans on the quest that HAS them, and a second quest alongside it whose items
      // are all at rest: the count is per reset work item, and the sweep spans every quest in
      // the guild rather than stopping at the first one.
      const questWithOrphans = QuestStub({
        id: QuestIdStub({ value: 'q-orphan-a' }),
        folder: QuestIdStub({ value: 'q-orphan-a' }),
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '44444444-4444-4444-4444-000000000001' }),
            status: 'in_progress',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '44444444-4444-4444-4444-000000000002' }),
            status: 'in_progress',
          }),
        ],
      });
      const questAtRest = QuestStub({
        id: QuestIdStub({ value: 'q-orphan-b' }),
        folder: QuestIdStub({ value: 'q-orphan-b' }),
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '44444444-4444-4444-4444-000000000003' }),
            status: 'pending',
          }),
        ],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [questWithOrphans, questAtRest] }],
      });
      proxy.setupModifyForQuest({ quest: questWithOrphans });

      const result = await questOrphanResetBroker();

      expect(result).toStrictEqual({ orphansReset: 2 });
      expect(
        proxy.getLastPersistedQuest().workItems.map((workItem) => workItem.status),
      ).toStrictEqual(['pending', 'pending']);
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

  describe('decides from the quest as loaded for the write, not from the discovery walk', () => {
    it('VALID: {walk sees the work item in_progress, quest on disk has it complete} => nothing is reset and nothing is written', async () => {
      // The guild/quest walk reads every quest.json under the dungeonmaster home, so on a busy
      // home it can take longer than a whole dispatch: the item it saw `in_progress` has since
      // been stamped with its session, signalled back and gone `complete`. Writing the walk's
      // verdict puts that finished item back to `pending` with its session cleared, and the
      // dispatcher re-runs a session that already signalled.
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'cccccccc-cccc-cccc-cccc-000000000008' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'q-stale-walk' });
      const workItemId = QuestWorkItemIdStub({ value: '55555555-5555-4555-8555-000000000001' });

      const staleQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: workItemId,
            status: 'in_progress',
            sessionId: SessionIdStub({ value: 'e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e4e4' }),
          }),
        ],
      });
      const questOnDisk = QuestStub({
        id: questId,
        folder: staleQuest.folder,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: workItemId,
            status: 'complete',
            sessionId: SessionIdStub({ value: 'e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e4e4' }),
          }),
        ],
      });

      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [staleQuest] }],
      });
      proxy.setupModifyForQuest({ quest: questOnDisk });

      const result = await questOrphanResetBroker();

      expect(result).toStrictEqual({ orphansReset: 0 });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
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
