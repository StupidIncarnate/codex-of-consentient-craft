import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questSpliceFixerBroker } from './quest-splice-fixer-broker';
import { questSpliceFixerBrokerProxy } from './quest-splice-fixer-broker.proxy';

type WorkItem = ReturnType<typeof WorkItemStub>;
type Quest = ReturnType<typeof QuestStub>;

const FAILED_WARD_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const DOWNSTREAM_SIEGE_ID = 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e';
const SPIRITMENDER_ID = 'c3d4e5f6-a7b8-4c0d-9e2f-3a4b5c6d7e8f';
const RETRY_WARD_ID = 'd4e5f6a7-b8c9-4d1e-8f3a-4b5c6d7e8f90';
const SECOND_SPIRITMENDER_ID = 'e5f6a7b8-c9d0-4e2f-8a4b-5c6d7e8f9012';

const lastWorkItems = ({ persisted }: { persisted: Quest[] }): WorkItem[] => {
  const last = persisted[persisted.length - 1];
  if (last === undefined) {
    throw new Error('No persisted quest found');
  }
  return [...last.workItems];
};

describe('questSpliceFixerBroker', () => {
  describe('splice', () => {
    it('VALID: {fixerItem + retryItem, downstream depends on failed} => appends both, rewires downstream onto retry, quest stays in_progress', async () => {
      const proxy = questSpliceFixerBrokerProxy();
      const failedId = QuestWorkItemIdStub({ value: FAILED_WARD_ID });
      const failedWardItem = WorkItemStub({ id: failedId, role: 'ward', status: 'failed' });
      const downstreamItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: DOWNSTREAM_SIEGE_ID }),
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [failedId],
      });
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [failedWardItem, downstreamItem],
      });

      proxy.setupQuestModify({ quest });

      const fixerItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: SPIRITMENDER_ID }),
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [failedId],
        insertedBy: failedId,
      });
      const retryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: RETRY_WARD_ID }),
        role: 'ward',
        status: 'pending',
        dependsOn: [fixerItem.id],
        insertedBy: failedId,
      });

      const result = await questSpliceFixerBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        quest,
        failedWorkItemId: failedId,
        fixerItems: [fixerItem],
        retryItem,
      });

      expect(result).toStrictEqual({ success: true });

      const persisted = proxy.getPersistedQuests();

      expect(persisted.map((q) => q.status)).toStrictEqual(['in_progress']);
      expect(lastWorkItems({ persisted })).toStrictEqual([
        failedWardItem,
        // downstream siege rewired from the failed ward onto the retry
        WorkItemStub({
          id: QuestWorkItemIdStub({ value: DOWNSTREAM_SIEGE_ID }),
          role: 'siegemaster',
          status: 'pending',
          dependsOn: [QuestWorkItemIdStub({ value: RETRY_WARD_ID })],
        }),
        fixerItem,
        retryItem,
      ]);
    });

    it('VALID: {two fixerItems + retryItem} => appends all three in order after existing items', async () => {
      const proxy = questSpliceFixerBrokerProxy();
      const failedId = QuestWorkItemIdStub({ value: FAILED_WARD_ID });
      const failedWardItem = WorkItemStub({ id: failedId, role: 'ward', status: 'failed' });
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [failedWardItem],
      });

      proxy.setupQuestModify({ quest });

      const fixerOne = WorkItemStub({
        id: QuestWorkItemIdStub({ value: SPIRITMENDER_ID }),
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [failedId],
        insertedBy: failedId,
      });
      const fixerTwo = WorkItemStub({
        id: QuestWorkItemIdStub({ value: SECOND_SPIRITMENDER_ID }),
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [failedId],
        insertedBy: failedId,
      });
      const retryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: RETRY_WARD_ID }),
        role: 'ward',
        status: 'pending',
        dependsOn: [fixerOne.id, fixerTwo.id],
        insertedBy: failedId,
      });

      const result = await questSpliceFixerBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        quest,
        failedWorkItemId: failedId,
        fixerItems: [fixerOne, fixerTwo],
        retryItem,
      });

      expect(result).toStrictEqual({ success: true });
      expect(lastWorkItems({ persisted: proxy.getPersistedQuests() })).toStrictEqual([
        failedWardItem,
        fixerOne,
        fixerTwo,
        retryItem,
      ]);
    });
  });

  describe('idempotency', () => {
    it('EDGE: {item already insertedBy failedWorkItemId} => no-ops without persisting a splice', async () => {
      const proxy = questSpliceFixerBrokerProxy();
      const failedId = QuestWorkItemIdStub({ value: FAILED_WARD_ID });
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: SPIRITMENDER_ID }),
            role: 'spiritmender',
            status: 'pending',
            insertedBy: failedId,
          }),
        ],
      });

      proxy.setupQuestModify({ quest });

      const fixerItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: SECOND_SPIRITMENDER_ID }),
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [failedId],
        insertedBy: failedId,
      });
      const retryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: RETRY_WARD_ID }),
        role: 'ward',
        status: 'pending',
        dependsOn: [fixerItem.id],
        insertedBy: failedId,
      });

      const result = await questSpliceFixerBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        quest,
        failedWorkItemId: failedId,
        fixerItems: [fixerItem],
        retryItem,
      });

      expect(result).toStrictEqual({ success: true });
      // No-op: the modify broker never ran, so nothing was persisted.
      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('EDGE: {second call after a real splice already added insertedBy items} => no duplicate persist', async () => {
      const proxy = questSpliceFixerBrokerProxy();
      const failedId = QuestWorkItemIdStub({ value: FAILED_WARD_ID });
      const fixerItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: SPIRITMENDER_ID }),
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [failedId],
        insertedBy: failedId,
      });
      const retryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: RETRY_WARD_ID }),
        role: 'ward',
        status: 'pending',
        dependsOn: [fixerItem.id],
        insertedBy: failedId,
      });

      const firstQuest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [WorkItemStub({ id: failedId, role: 'ward', status: 'failed' })],
      });

      proxy.setupQuestModify({ quest: firstQuest });

      const firstResult = await questSpliceFixerBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        quest: firstQuest,
        failedWorkItemId: failedId,
        fixerItems: [fixerItem],
        retryItem,
      });

      expect(firstResult).toStrictEqual({ success: true });

      const afterFirst = proxy.getPersistedQuests();

      expect(afterFirst.map((q) => q.status)).toStrictEqual(['in_progress']);
      expect(lastWorkItems({ persisted: afterFirst })).toStrictEqual([
        WorkItemStub({ id: failedId, role: 'ward', status: 'failed' }),
        fixerItem,
        retryItem,
      ]);

      // Second call against a quest that now carries the previously-spliced items.
      const secondQuest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'ward', status: 'failed' }),
          fixerItem,
          retryItem,
        ],
      });

      const secondResult = await questSpliceFixerBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        quest: secondQuest,
        failedWorkItemId: failedId,
        fixerItems: [fixerItem],
        retryItem,
      });

      expect(secondResult).toStrictEqual({ success: true });
      // No additional persist happened — the second call short-circuited on the insertedBy guard.
      expect(lastWorkItems({ persisted: proxy.getPersistedQuests() })).toStrictEqual([
        WorkItemStub({ id: failedId, role: 'ward', status: 'failed' }),
        fixerItem,
        retryItem,
      ]);
    });
  });

  describe('delegation to questWorkItemInsertBroker', () => {
    it('VALID: {fixerItem + retryItem} => insert primitive appends [...fixers, retry] AND applies replacementMapping rewire', async () => {
      const proxy = questSpliceFixerBrokerProxy();
      const failedId = QuestWorkItemIdStub({ value: FAILED_WARD_ID });
      const downstreamItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: DOWNSTREAM_SIEGE_ID }),
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [failedId],
      });
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        status: 'in_progress',
        workItems: [WorkItemStub({ id: failedId, role: 'ward', status: 'failed' }), downstreamItem],
      });

      proxy.setupQuestModify({ quest });

      const fixerItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: SPIRITMENDER_ID }),
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [failedId],
        insertedBy: failedId,
      });
      const retryItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: RETRY_WARD_ID }),
        role: 'ward',
        status: 'pending',
        dependsOn: [fixerItem.id],
        insertedBy: failedId,
      });

      await questSpliceFixerBroker({
        questId: QuestIdStub({ value: 'test-quest' }),
        quest,
        failedWorkItemId: failedId,
        fixerItems: [fixerItem],
        retryItem,
      });

      const items = lastWorkItems({ persisted: proxy.getPersistedQuests() });

      // Last two items prove delegation appended newWorkItems = [...fixers, retry] verbatim.
      expect(items.slice(2)).toStrictEqual([fixerItem, retryItem]);
      // replacementMapping {oldId: failedId, newId: retryId} rewired the downstream siege dep.
      expect(items[1]).toStrictEqual(
        WorkItemStub({
          id: QuestWorkItemIdStub({ value: DOWNSTREAM_SIEGE_ID }),
          role: 'siegemaster',
          status: 'pending',
          dependsOn: [QuestWorkItemIdStub({ value: RETRY_WARD_ID })],
        }),
      );
    });
  });
});
