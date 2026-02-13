import { orchestratorGetQuestAdapter } from './orchestrator-get-quest-adapter';
import { orchestratorGetQuestAdapterProxy } from './orchestrator-get-quest-adapter.proxy';

describe('orchestratorGetQuestAdapter', () => {
  describe('successful get', () => {
    it('VALID: {questId} => returns quest result', async () => {
      orchestratorGetQuestAdapterProxy();

      const result = await orchestratorGetQuestAdapter({
        questId: 'test-quest',
      });

      expect(result).toStrictEqual({ quest: {} });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();

      proxy.throws({ error: new Error('Quest not found') });

      await expect(orchestratorGetQuestAdapter({ questId: 'missing' })).rejects.toThrow(
        /Quest not found/u,
      );
    });
  });
});
