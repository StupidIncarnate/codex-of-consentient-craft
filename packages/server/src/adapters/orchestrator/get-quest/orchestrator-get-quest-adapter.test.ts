import { QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestAdapter } from './orchestrator-get-quest-adapter';
import { orchestratorGetQuestAdapterProxy } from './orchestrator-get-quest-adapter.proxy';

describe('orchestratorGetQuestAdapter', () => {
  describe('successful get', () => {
    it('VALID: {questId} => returns quest result', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'test-quest' });
      proxy.returns({ questId, result: { quest: {} } as never });

      const result = await orchestratorGetQuestAdapter({ questId });

      expect(result).toStrictEqual({ quest: {} });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'missing' });

      proxy.throws({ questId, error: new Error('Quest not found') });

      await expect(orchestratorGetQuestAdapter({ questId })).rejects.toThrow(/Quest not found/u);
    });
  });
});
