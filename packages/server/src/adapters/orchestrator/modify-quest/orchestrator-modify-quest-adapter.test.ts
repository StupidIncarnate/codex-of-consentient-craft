import { orchestratorModifyQuestAdapter } from './orchestrator-modify-quest-adapter';
import { orchestratorModifyQuestAdapterProxy } from './orchestrator-modify-quest-adapter.proxy';

describe('orchestratorModifyQuestAdapter', () => {
  describe('successful modify', () => {
    it('VALID: {questId, input} => returns modify quest result', async () => {
      orchestratorModifyQuestAdapterProxy();

      const result = await orchestratorModifyQuestAdapter({
        questId: 'test-quest',
        input: {} as never,
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorModifyQuestAdapterProxy();

      proxy.throws({ error: new Error('Failed to modify quest') });

      await expect(
        orchestratorModifyQuestAdapter({
          questId: 'test-quest',
          input: {} as never,
        }),
      ).rejects.toThrow(/Failed to modify quest/u);
    });
  });
});
