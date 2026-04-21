import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questWorkItemInsertBroker } from './quest-work-item-insert-broker';
import { questWorkItemInsertBrokerProxy } from './quest-work-item-insert-broker.proxy';

describe('questWorkItemInsertBroker', () => {
  describe('insert new items', () => {
    it('VALID: {newWorkItems: [item]} => calls modify broker to persist', async () => {
      const proxy = questWorkItemInsertBrokerProxy();
      const existingItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'complete',
      });
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        workItems: [existingItem],
      });

      proxy.setupQuestModify({ quest });

      const newItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [],
      });

      await expect(
        questWorkItemInsertBroker({
          questId: QuestIdStub({ value: 'test-quest' }),
          quest,
          newWorkItems: [newItem],
        }),
      ).resolves.toStrictEqual({ success: true });
    });
  });

  describe('replacement mapping', () => {
    it('VALID: {replacementMapping swaps oldId for newId in dependsOn} => calls modify broker', async () => {
      const proxy = questWorkItemInsertBrokerProxy();
      const oldItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const downstreamItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' }),
        role: 'lawbringer',
        status: 'pending',
        dependsOn: [oldItemId],
      });
      const quest = QuestStub({
        id: 'test-quest',
        folder: '001-test-quest',
        workItems: [
          WorkItemStub({ id: oldItemId, role: 'siegemaster', status: 'failed' }),
          downstreamItem,
        ],
      });

      proxy.setupQuestModify({ quest });

      const newSiegeId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
      });
      const newItem = WorkItemStub({
        id: newSiegeId,
        role: 'siegemaster',
        status: 'pending',
        dependsOn: [],
      });

      await expect(
        questWorkItemInsertBroker({
          questId: QuestIdStub({ value: 'test-quest' }),
          quest,
          newWorkItems: [newItem],
          replacementMapping: [{ oldId: oldItemId, newId: newSiegeId }],
        }),
      ).resolves.toStrictEqual({ success: true });
    });
  });
});
