import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';

import { orchestratorModifyQuestAdapter } from './orchestrator-modify-quest-adapter';
import { orchestratorModifyQuestAdapterProxy } from './orchestrator-modify-quest-adapter.proxy';

describe('orchestratorModifyQuestAdapter', () => {
  describe('successful modify', () => {
    it('VALID: {questId, input} => returns modify quest result', async () => {
      const proxy = orchestratorModifyQuestAdapterProxy();
      const result = ModifyQuestResultStub();

      proxy.returns({ questId: 'test-quest', result });

      const modifyResult = await orchestratorModifyQuestAdapter({
        questId: 'test-quest',
        input: {} as never,
      });

      expect(modifyResult).toStrictEqual(result);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorModifyQuestAdapterProxy();

      proxy.throws({ questId: 'test-quest', error: new Error('Failed to modify quest') });

      await expect(
        orchestratorModifyQuestAdapter({
          questId: 'test-quest',
          input: {} as never,
        }),
      ).rejects.toThrow(/Failed to modify quest/u);
    });
  });
});
