import { orchestratorVerifyQuestAdapter } from './orchestrator-verify-quest-adapter';
import { orchestratorVerifyQuestAdapterProxy } from './orchestrator-verify-quest-adapter.proxy';

describe('orchestratorVerifyQuestAdapter', () => {
  describe('successful verify', () => {
    it('VALID: {questId} => returns verify quest result', async () => {
      orchestratorVerifyQuestAdapterProxy();

      const result = await orchestratorVerifyQuestAdapter({
        questId: 'test-quest',
      });

      expect(result).toStrictEqual({ success: true, checks: [] });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorVerifyQuestAdapterProxy();

      proxy.throws({ error: new Error('Failed to verify quest') });

      await expect(orchestratorVerifyQuestAdapter({ questId: 'test-quest' })).rejects.toThrow(
        /Failed to verify quest/u,
      );
    });
  });
});
