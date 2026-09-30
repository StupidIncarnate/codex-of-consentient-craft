import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { questWorkItemInsertBroker } from './quest-work-item-insert-broker';
import { questWorkItemInsertBrokerProxy } from './quest-work-item-insert-broker.proxy';
import { ReplacementEntryStub } from '../../../contracts/replacement-entry/replacement-entry.stub';

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
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
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

    it('ERROR: {questModifyBroker resolves a failure} => passes that failure through instead of a hardcoded success', async () => {
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
      proxy.setupModifyFailure();

      const newItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
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
      ).resolves.toStrictEqual({ success: false });
    });
  });

  describe('replacement mapping', () => {
    it('VALID: {replacementMapping swaps oldId for newId in dependsOn} => calls modify broker', async () => {
      const proxy = questWorkItemInsertBrokerProxy();
      const oldItemId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const downstreamItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: '03a9d8d8-7d74-4041-981c-977812e6dc45' }),
        role: 'flowrider',
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
        value: '2063553f-9f1c-6c33-8d24-05ca15a4f935',
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
          replacementMapping: [ReplacementEntryStub({ oldId: oldItemId, newId: newSiegeId })],
        }),
      ).resolves.toStrictEqual({ success: true });
    });
  });
});
