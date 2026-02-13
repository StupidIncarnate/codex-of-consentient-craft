import { ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorStartQuestAdapter } from './orchestrator-start-quest-adapter';
import { orchestratorStartQuestAdapterProxy } from './orchestrator-start-quest-adapter.proxy';

describe('orchestratorStartQuestAdapter', () => {
  describe('successful start', () => {
    it('VALID: {questId} => returns processId', async () => {
      const proxy = orchestratorStartQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-123' });

      proxy.returns({ processId });

      const result = await orchestratorStartQuestAdapter({ questId });

      expect(result).toBe(processId);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorStartQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(orchestratorStartQuestAdapter({ questId })).rejects.toThrow(/Quest not found/u);
    });
  });
});
