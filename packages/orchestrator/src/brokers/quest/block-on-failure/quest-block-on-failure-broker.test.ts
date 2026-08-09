import {
  ErrorMessageStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questBlockOnFailureBroker } from './quest-block-on-failure-broker';
import { questBlockOnFailureBrokerProxy } from './quest-block-on-failure-broker.proxy';

describe('questBlockOnFailureBroker', () => {
  describe('block on failure', () => {
    it('VALID: {failed item + pending items + complete items} => fails the failed item, skips all pending, leaves complete untouched, blocks quest', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingOneId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const pendingTwoId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c1d-8e2f-3a4b5c6d7e8f' });
      const completeOneId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d2e-8f3a-4b5c6d7e8f90' });
      const completeTwoId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e3f-8a4b-5c6d7e8f9012' });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: completeOneId, role: 'flowrider', status: 'complete' }),
          WorkItemStub({ id: completeTwoId, role: 'codeweaver', status: 'complete' }),
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: pendingOneId,
            role: 'ward',
            status: 'pending',
            dependsOn: [failedId],
          }),
          WorkItemStub({
            id: pendingTwoId,
            role: 'blightwarden',
            status: 'pending',
            dependsOn: [pendingOneId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(result).toStrictEqual({ blocked: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('blocked');
      expect(persisted.workItems.map((w) => ({ id: w.id, status: w.status }))).toStrictEqual([
        { id: completeOneId, status: 'complete' },
        { id: completeTwoId, status: 'complete' },
        { id: failedId, status: 'failed' },
        { id: pendingOneId, status: 'skipped' },
        { id: pendingTwoId, status: 'skipped' },
      ]);
    });

    it('VALID: {failedWorkItemId, pending downstream item} => marks failed, skips pending, sets quest blocked', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: pendingId,
            role: 'blightwarden',
            status: 'pending',
            dependsOn: [failedId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(result).toStrictEqual({ blocked: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('blocked');
      expect(persisted.workItems.find((w) => w.id === failedId)?.status).toBe('failed');
      expect(persisted.workItems.find((w) => w.id === pendingId)?.status).toBe('skipped');
    });
  });

  describe('reason', () => {
    it('VALID: {reason supplied} => the failed work item is written with that exact errorMessage', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const reason = ErrorMessageStub({
        value: 'quest worktree missing: /home/user/.dungeonmaster/worktrees/quest-42',
      });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: pendingId,
            role: 'blightwarden',
            status: 'pending',
            dependsOn: [failedId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
        reason,
      });

      expect(result).toStrictEqual({ blocked: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(
        persisted.workItems.map((w) => ({
          id: w.id,
          status: w.status,
          errorMessage: w.errorMessage,
        })),
      ).toStrictEqual([
        { id: failedId, status: 'failed', errorMessage: reason },
        { id: pendingId, status: 'skipped', errorMessage: undefined },
      ]);
    });

    it('VALID: {reason omitted} => the failed work item is written with no errorMessage key', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: pendingId,
            role: 'blightwarden',
            status: 'pending',
            dependsOn: [failedId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(result).toStrictEqual({ blocked: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(
        persisted.workItems.map((w) => ({
          id: w.id,
          status: w.status,
          errorMessage: w.errorMessage,
        })),
      ).toStrictEqual([
        { id: failedId, status: 'failed', errorMessage: undefined },
        { id: pendingId, status: 'skipped', errorMessage: undefined },
      ]);
    });

    it('VALID: {reason supplied, other pending items present} => only the failed item carries the errorMessage; the drained items are plain skipped patches', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingOneId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const pendingTwoId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c1d-8e2f-3a4b5c6d7e8f' });
      const reason = ErrorMessageStub({
        value: 'quest worktree missing: /home/user/.dungeonmaster/worktrees/quest-99',
      });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: pendingOneId,
            role: 'ward',
            status: 'pending',
            dependsOn: [failedId],
          }),
          WorkItemStub({
            id: pendingTwoId,
            role: 'blightwarden',
            status: 'pending',
            dependsOn: [pendingOneId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
        reason,
      });

      expect(result).toStrictEqual({ blocked: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(
        persisted.workItems.map((w) => ({
          id: w.id,
          status: w.status,
          errorMessage: w.errorMessage,
        })),
      ).toStrictEqual([
        { id: failedId, status: 'failed', errorMessage: reason },
        { id: pendingOneId, status: 'skipped', errorMessage: undefined },
        { id: pendingTwoId, status: 'skipped', errorMessage: undefined },
      ]);
    });
  });

  describe('already-failed item', () => {
    it('VALID: {item already failed, quest still in_progress} => does not error, drains pending and blocks', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'failed' }),
          WorkItemStub({
            id: pendingId,
            role: 'blightwarden',
            status: 'pending',
            dependsOn: [failedId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(result).toStrictEqual({ blocked: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('blocked');
      expect(persisted.workItems.find((w) => w.id === failedId)?.status).toBe('failed');
      expect(persisted.workItems.find((w) => w.id === pendingId)?.status).toBe('skipped');
    });
  });

  describe('idempotency', () => {
    it('VALID: {failed item already terminal, quest already blocked} => no-op, returns blocked without re-persisting', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const skippedId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'blocked',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'failed' }),
          WorkItemStub({
            id: skippedId,
            role: 'blightwarden',
            status: 'skipped',
            dependsOn: [failedId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(result).toStrictEqual({ blocked: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });

    it('VALID: {called twice} => second call is a no-op, no double mutation', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const pendingId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });

      const firstQuest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: pendingId,
            role: 'blightwarden',
            status: 'pending',
            dependsOn: [failedId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest: firstQuest });

      await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      const afterFirst = proxy.getLastPersistedQuest();

      expect(afterFirst.status).toBe('blocked');
      expect(afterFirst.workItems.find((w) => w.id === failedId)?.status).toBe('failed');
      expect(afterFirst.workItems.find((w) => w.id === pendingId)?.status).toBe('skipped');

      // The state the broker just produced is what disk now holds: quest blocked, failed item
      // terminal, pending item skipped. Re-feed exactly that as the second-call read state.
      const blockedQuest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'blocked',
        workItems: [
          WorkItemStub({ id: failedId, role: 'codeweaver', status: 'failed' }),
          WorkItemStub({
            id: pendingId,
            role: 'blightwarden',
            status: 'skipped',
            dependsOn: [failedId],
          }),
        ],
      });

      proxy.setupQuestFound({ quest: blockedQuest });

      const writesBeforeSecondCall = proxy.getAllPersistedContents();

      const secondResult = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(secondResult).toStrictEqual({ blocked: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual(writesBeforeSecondCall);
    });
  });

  describe('quest not found', () => {
    it('EMPTY: {questId for missing quest} => returns blocked false, persists nothing', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();
      proxy.setupQuestNotFound();

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'missing-quest' }),
        failedWorkItemId: QuestWorkItemIdStub({
          value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
        }),
      });

      expect(result).toStrictEqual({ blocked: false });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('the status write is verified, not assumed', () => {
    it('ERROR: {quest at complete, block requested} => returns blocked:false because the status write was rejected', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      // `complete`'s only legal status edge is `-> merging` (questStatusTransitionsStatics), and
      // the real questModifyBroker rejects the write before that check even runs — a `complete`
      // quest has an empty allowedFields set, so `status: 'blocked'` is refused outright. Either
      // way `success: false` comes back, which is the natural repro for a merge running on a
      // quest that started terminal: the write is rejected, not applied.
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'complete',
        workItems: [WorkItemStub({ id: failedId, role: 'codeweaver', status: 'in_progress' })],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(result).toStrictEqual({ blocked: false });
    });

    it('VALID: {quest at merging, block requested} => returns blocked:true because merging -> blocked is a legal transition', async () => {
      const proxy = questBlockOnFailureBrokerProxy();
      proxy.setupPassthrough();

      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });

      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'merging',
        workItems: [WorkItemStub({ id: failedId, role: 'warpgate', status: 'in_progress' })],
      });

      proxy.setupQuestFound({ quest });

      const result = await questBlockOnFailureBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        failedWorkItemId: failedId,
      });

      expect(result).toStrictEqual({ blocked: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.status).toBe('blocked');
    });
  });
});
