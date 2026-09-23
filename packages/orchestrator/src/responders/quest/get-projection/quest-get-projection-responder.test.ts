import {
  OperationItemIdStub,
  OperationItemStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questProjectionBuildTransformer } from '../../../transformers/quest-projection-build/quest-projection-build-transformer';
import { QuestGetProjectionResponderProxy } from './quest-get-projection-responder.proxy';

describe('QuestGetProjectionResponder', () => {
  describe('returning a projection', () => {
    it('VALID: {known questId} => returns the structured projection, not text', async () => {
      const proxy = QuestGetProjectionResponderProxy();
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

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result).toStrictEqual(questProjectionBuildTransformer({ quest }));
    });

    it('EMPTY: {quest with no operations minted yet} => returns an empty scope list', async () => {
      const proxy = QuestGetProjectionResponderProxy();
      const quest = QuestStub({ id: 'add-auth', operations: [], workItems: [] });
      proxy.setupQuestFound({ quest });

      const result = await proxy.callResponder({ questId: quest.id });

      expect(result.scopes).toStrictEqual([]);
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {questId: ""} => throws before any load is attempted', async () => {
      const proxy = QuestGetProjectionResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId: '' })).rejects.toThrow(
        /String must contain at least 1 character/u,
      );
    });

    it('ERROR: {unknown questId} => propagates the broker throw', async () => {
      const proxy = QuestGetProjectionResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId: 'no-such-quest' })).rejects.toThrow(
        /no-such-quest/u,
      );
    });
  });
});
