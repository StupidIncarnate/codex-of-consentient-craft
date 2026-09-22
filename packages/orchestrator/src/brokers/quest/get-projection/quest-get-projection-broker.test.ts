import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questProjectionBuildTransformer } from '../../../transformers/quest-projection-build/quest-projection-build-transformer';
import { questGetProjectionBroker } from './quest-get-projection-broker';
import { questGetProjectionBrokerProxy } from './quest-get-projection-broker.proxy';

describe('questGetProjectionBroker', () => {
  describe('projecting a quest', () => {
    it('VALID: {quest with a codeweaver scope one step in} => returns the projection the transformer computes for it', async () => {
      const proxy = questGetProjectionBrokerProxy();
      const opId = OperationItemIdStub({ value: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479' });
      const planWorkItemId = QuestWorkItemIdStub({
        value: '11111111-1111-4111-8111-111111111111',
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: opId,
            role: 'codeweaver',
            text: 'core: config load+validate adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: planWorkItemId,
            role: 'codeweaver',
            status: 'complete',
            step: 'plan',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetProjectionBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result).toStrictEqual(questProjectionBuildTransformer({ quest }));
    });

    it('VALID: {quest with real step names} => real steps carry the real agentFlowStatics step keys', async () => {
      const proxy = questGetProjectionBrokerProxy();
      const opId = OperationItemIdStub({ value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479' });
      const planWorkItemId = QuestWorkItemIdStub({
        value: '22222222-2222-4222-8222-222222222222',
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: opId,
            role: 'flowrider',
            text: 'Flowrider: author the test suites that prove this flow',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: planWorkItemId,
            role: 'flowrider',
            status: 'complete',
            step: 'plan',
            relatedDataItems: [`operations/${opId}`],
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questGetProjectionBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result.scopes[0]?.steps.map((row) => row.step)).toStrictEqual([
        'plan',
        'work',
        'review',
        'commit',
        'ward',
      ]);
    });

    it('EMPTY: {quest with no operations minted yet} => returns an empty scope list and zero counts', async () => {
      const proxy = questGetProjectionBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', operations: [], workItems: [] });
      proxy.setupQuestFound({ quest });

      const result = await questGetProjectionBroker({ questId: QuestIdStub({ value: quest.id }) });

      expect(result).toStrictEqual({
        questId: 'add-auth',
        scopes: [],
        totalPlannedSteps: 0,
        completedSteps: 0,
      });
    });
  });

  describe('quest not found', () => {
    it('ERROR: {unknown questId} => throws rather than returning an empty projection', async () => {
      const proxy = questGetProjectionBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questGetProjectionBroker({ questId: QuestIdStub({ value: 'no-such-quest' }) }),
      ).rejects.toThrow(/no-such-quest/u);
    });
  });
});
