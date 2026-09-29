import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

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
      const guildId = GuildIdStub({ value: 'b40d0abc-a4d7-14a5-8b00-8253b9550b34' });
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
      const guildId = GuildIdStub({ value: '58ee9f9c-1f9a-8433-b8d5-1bceaac7c5f8' });
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
      const guildId = GuildIdStub({ value: '2483cf00-9822-1f0a-bb52-9675c6078d3e' });
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
            id: QuestWorkItemIdStub({ value: 'c9f09068-2dc7-7b19-8458-93c4e88a56fc' }),
            status: 'in_progress',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '1a764190-6546-2fca-918d-12c3cd3cbe68' }),
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
            id: QuestWorkItemIdStub({ value: '5be68fa8-eb1e-59ff-a4f9-6fe83ccd819f' }),
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
    it('VALID: {in_progress work item carries sessionId+startedAt} => orphan reset writes quest.json with those fields removed', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: '091fea1e-ff81-1e02-913e-d87010a1e2ad' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const questId = QuestIdStub({ value: 'q-clear-fields' });
      const workItemId = QuestWorkItemIdStub({ value: '3b80b06d-9fd3-8724-b5ba-4ec4aac6ca06' });
      const orphan = WorkItemStub({
        id: workItemId,
        status: 'in_progress',
        sessionId: SessionIdStub({ value: 'a552a01482d154100' }),
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
      const guildId = GuildIdStub({ value: '0b5d933d-2c15-51c6-89dc-0a735edeea25' });
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
      const guildId = GuildIdStub({ value: 'c7c99610-f0cf-4e5e-88a8-06d14b70528b' });
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
      const guildId = GuildIdStub({ value: '2157feba-0ec5-7477-a847-c2dd8eb96ebe' });
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
      const guildId = GuildIdStub({ value: '32f3d493-3e51-4b9d-ae74-f0183b6c1376' });
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

  describe('excludeWorkItemId', () => {
    it('VALID: {live item re-stamped with a sessionId the sweep was not told about} => preserved by id, returns orphansReset: 0', async () => {
      // The node-dispatch race this exclusion exists for: the reactor starts a watcher for the
      // sessionId the item carried at dispatch (a RESUMED item carries its retained one), and by
      // the time this sweep reads the quest the child's init line has re-stamped the item with
      // the session Claude CLI minted for this run. The item is RUNNING with a live child, so a
      // sessionId-only exclusion resets an agent that is still working.
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: '4f237639-9535-3767-8a33-4237205d5c9f' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const watchedSessionId = SessionIdStub({ value: 'e4e4e4e4-e4e4-4e4e-8e4e-e4e4e4e4e4e4' });
      const respawnedSessionId = SessionIdStub({ value: 'f5f5f5f5-f5f5-4f5f-8f5f-f5f5f5f5f5f5' });
      const liveWorkItemId = QuestWorkItemIdStub({ value: '55555555-5555-4555-8555-000000000001' });
      const liveItem = WorkItemStub({
        id: liveWorkItemId,
        status: 'in_progress',
        sessionId: respawnedSessionId,
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-restamped' }),
        status: 'in_progress',
        workItems: [liveItem],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      // Staged deliberately even though nothing should be written: without it the write path
      // throws on an unmocked call, the broker swallows it, and `orphansReset: 0` would hold
      // whether or not the exclusion worked.
      proxy.setupModifyForQuest({ quest });

      const result = await questOrphanResetBroker({
        excludeSessionId: watchedSessionId,
        excludeWorkItemId: liveWorkItemId,
      });

      expect(result).toStrictEqual({ orphansReset: 0 });
    });

    it('VALID: {excluded work item plus a genuine orphan} => only the orphan is reset', async () => {
      const proxy = questOrphanResetBrokerProxy();
      const guildId = GuildIdStub({ value: 'ed4035a4-dbec-687f-a0d4-c90379925aad' });
      const guildItem = GuildListItemStub({ id: guildId, valid: true });
      const watchedSessionId = SessionIdStub({ value: 'a6a6a6a6-a6a6-4a6a-8a6a-a6a6a6a6a6a6' });
      const liveWorkItemId = QuestWorkItemIdStub({ value: '44444444-4444-4444-8444-000000000001' });
      const liveItem = WorkItemStub({
        id: liveWorkItemId,
        status: 'in_progress',
        sessionId: SessionIdStub({ value: 'b7b7b7b7-b7b7-4b7b-8b7b-b7b7b7b7b7b7' }),
      });
      const orphanItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '44444444-4444-4444-8444-000000000002' }),
        status: 'in_progress',
        sessionId: SessionIdStub({ value: 'c8c8c8c8-c8c8-4c8c-8c8c-c8c8c8c8c8c8' }),
      });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-restamped-mixed' }),
        status: 'in_progress',
        workItems: [liveItem, orphanItem],
      });
      proxy.setupGuildsAndQuests({
        guildItems: [guildItem],
        questsByGuildId: [{ guildId, quests: [quest] }],
      });
      proxy.setupModifyForQuest({ quest });

      const result = await questOrphanResetBroker({
        excludeSessionId: watchedSessionId,
        excludeWorkItemId: liveWorkItemId,
      });

      expect(result).toStrictEqual({ orphansReset: 1 });
    });
  });
});
