import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts';

import { orchestratorModifyQuestAdapter } from './orchestrator-modify-quest-adapter';
import { orchestratorModifyQuestAdapterProxy } from './orchestrator-modify-quest-adapter.proxy';

describe('orchestratorModifyQuestAdapter', () => {
  describe('successful modify', () => {
    it('VALID: {questId, input} => returns ModifyQuestResult', async () => {
      const proxy = orchestratorModifyQuestAdapterProxy();
      const input = ModifyQuestInputStub({ questId: 'add-auth' });
      const expectedResult = ModifyQuestResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorModifyQuestAdapter({
        questId: 'add-auth',
        input,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorModifyQuestAdapterProxy();
      const input = ModifyQuestInputStub({ questId: 'non-existent' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorModifyQuestAdapter({
          questId: 'non-existent',
          input,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
