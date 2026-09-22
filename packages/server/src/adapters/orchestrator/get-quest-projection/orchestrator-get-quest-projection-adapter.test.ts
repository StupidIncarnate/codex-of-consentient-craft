import { QuestIdStub, QuestProjectionStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestProjectionAdapter } from './orchestrator-get-quest-projection-adapter';
import { orchestratorGetQuestProjectionAdapterProxy } from './orchestrator-get-quest-projection-adapter.proxy';

describe('orchestratorGetQuestProjectionAdapter', () => {
  describe('successful get projection', () => {
    it('VALID: {questId} => returns the quest projection the orchestrator computed', async () => {
      const proxy = orchestratorGetQuestProjectionAdapterProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const projection = QuestProjectionStub({
        questId,
        totalPlannedSteps: 5,
        completedSteps: 1,
      });
      proxy.returns({ questId, projection });

      const result = await orchestratorGetQuestProjectionAdapter({ questId });

      expect(result).toStrictEqual(projection);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => rejects with the orchestrator error', async () => {
      const proxy = orchestratorGetQuestProjectionAdapterProxy();
      const questId = QuestIdStub({ value: 'missing-quest' });

      proxy.throws({ questId, error: new Error('Quest not found: missing-quest') });

      await expect(orchestratorGetQuestProjectionAdapter({ questId })).rejects.toThrow(
        /^Quest not found: missing-quest$/u,
      );
    });
  });
});
