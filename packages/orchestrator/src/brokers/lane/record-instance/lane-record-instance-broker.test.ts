import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

import { QuestWorkInstanceStub } from '../../../contracts/quest-work-instance/quest-work-instance.stub';
import { laneRecordInstanceBroker } from './lane-record-instance-broker';
import { laneRecordInstanceBrokerProxy } from './lane-record-instance-broker.proxy';

const QUEST_PATH = AbsoluteFilePathStub({
  value: '/home/testuser/.dungeonmaster/guilds/g1/quests/lane-record-quest',
});

describe('laneRecordInstanceBroker', () => {
  describe('a work item with no existing payload', () => {
    it('VALID: {needsLane item, no payload} => persists payload.instance and returns the instance', async () => {
      const proxy = laneRecordInstanceBrokerProxy();
      const questId = QuestIdStub({ value: 'lane-record-happy' });
      const workItemId = QuestWorkItemIdStub({ value: '2f6a4505-1ac4-6d00-96f1-2d4744cbd924' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        status: 'pending',
        step: 'happyWalk',
        needsLane: true,
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest, questPath: QUEST_PATH });
      const instance = QuestWorkInstanceStub();

      const result = await laneRecordInstanceBroker({
        questId,
        questPath: QUEST_PATH,
        workItemId,
        instance,
      });

      expect(result).toStrictEqual(instance);

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.workItems).toStrictEqual([
        WorkItemStub({
          id: workItemId,
          role: 'siegemaster',
          status: 'pending',
          step: 'happyWalk',
          needsLane: true,
          payload: { instance },
        }),
      ]);
    });
  });

  describe('a work item carrying an existing payload', () => {
    it("VALID: {payload already carries a brief} => merges instance in, keeping the brief's other keys", async () => {
      const proxy = laneRecordInstanceBrokerProxy();
      const questId = QuestIdStub({ value: 'lane-record-merge' });
      const workItemId = QuestWorkItemIdStub({ value: '712e633e-8523-4a1c-a1d8-fa6941df90dc' });
      const workItem = WorkItemStub({
        id: workItemId,
        role: 'siegemaster',
        status: 'pending',
        step: 'adversarial',
        needsLane: true,
        payload: { baselineInstanceId: 'inst_00000000' },
      });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest, questPath: QUEST_PATH });
      const instance = QuestWorkInstanceStub();

      await laneRecordInstanceBroker({ questId, questPath: QUEST_PATH, workItemId, instance });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.workItems).toStrictEqual([
        WorkItemStub({
          id: workItemId,
          role: 'siegemaster',
          status: 'pending',
          step: 'adversarial',
          needsLane: true,
          payload: { baselineInstanceId: 'inst_00000000', instance },
        }),
      ]);
    });
  });
});
