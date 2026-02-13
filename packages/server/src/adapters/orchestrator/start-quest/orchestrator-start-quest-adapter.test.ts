import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorStartQuestAdapter } from './orchestrator-start-quest-adapter';
import { orchestratorStartQuestAdapterProxy } from './orchestrator-start-quest-adapter.proxy';

describe('orchestratorStartQuestAdapter', () => {
  describe('successful start', () => {
    it('VALID: {questId} => returns process id', async () => {
      orchestratorStartQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      const result = await orchestratorStartQuestAdapter({ questId });

      expect(result).toBe('proc-12345');
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorStartQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });

      proxy.throws({ error: new Error('Failed to start quest') });

      await expect(orchestratorStartQuestAdapter({ questId })).rejects.toThrow(
        /Failed to start quest/u,
      );
    });
  });
});
