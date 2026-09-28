import {
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { preStampInProgressLayerBroker } from './pre-stamp-in-progress-layer-broker';
import { preStampInProgressLayerBrokerProxy } from './pre-stamp-in-progress-layer-broker.proxy';

const STARTED_AT = '2024-01-15T10:00:00.000Z';

describe('preStampInProgressLayerBroker', () => {
  describe('happy path', () => {
    it('VALID: {quest in_progress, target work item pending} => stamps in_progress + startedAt and persists', async () => {
      const proxy = preStampInProgressLayerBrokerProxy();
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(STARTED_AT);
      const questId = QuestIdStub({ value: 'pre-stamp-happy' });
      const workItemId = QuestWorkItemIdStub({ value: '03048909-e478-200e-95e2-05df152332fb' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver', status: 'pending' });
      const quest = QuestStub({ id: questId, status: 'in_progress', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const result = await preStampInProgressLayerBroker({ questId, workItemId });

      expect(result).toStrictEqual({ stamped: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.workItems).toStrictEqual([
        WorkItemStub({
          id: workItemId,
          role: 'codeweaver',
          status: 'in_progress',
          startedAt: STARTED_AT,
        }),
      ]);
    });

    it('VALID: {quest with a sibling work item} => stamps only the addressed work item, leaving the sibling untouched', async () => {
      const proxy = preStampInProgressLayerBrokerProxy();
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(STARTED_AT);
      const questId = QuestIdStub({ value: 'pre-stamp-sibling' });
      const targetId = QuestWorkItemIdStub({ value: '6b0d7ae2-3496-8a9b-accb-9004cb77ab00' });
      const siblingId = QuestWorkItemIdStub({ value: 'dd947b71-4419-5b38-b454-a7d66b8df52a' });
      const target = WorkItemStub({ id: targetId, role: 'codeweaver', status: 'pending' });
      const sibling = WorkItemStub({ id: siblingId, role: 'flowrider', status: 'complete' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [target, sibling],
      });
      proxy.setupQuestFound({ quest });

      const result = await preStampInProgressLayerBroker({ questId, workItemId: targetId });

      expect(result).toStrictEqual({ stamped: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted.workItems).toStrictEqual([
        WorkItemStub({
          id: targetId,
          role: 'codeweaver',
          status: 'in_progress',
          startedAt: STARTED_AT,
        }),
        WorkItemStub({ id: siblingId, role: 'flowrider', status: 'complete' }),
      ]);
    });
  });

  describe('paused guard', () => {
    it('VALID: {quest reads paused} => refuses the stamp, returns {stamped:false}, and persists nothing', async () => {
      const proxy = preStampInProgressLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'pre-stamp-paused' });
      const workItemId = QuestWorkItemIdStub({ value: '31c28010-a40b-7c2f-9af8-586c0e717fa2' });
      const workItem = WorkItemStub({ id: workItemId, role: 'codeweaver', status: 'pending' });
      const quest = QuestStub({ id: questId, status: 'paused', workItems: [workItem] });
      proxy.setupQuestFound({ quest });

      const result = await preStampInProgressLayerBroker({ questId, workItemId });

      expect(result).toStrictEqual({ stamped: false });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });
});
