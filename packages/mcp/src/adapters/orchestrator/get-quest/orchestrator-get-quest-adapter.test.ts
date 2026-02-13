import { GetQuestResultStub } from '../../../contracts/get-quest-result/get-quest-result.stub';

import { orchestratorGetQuestAdapter } from './orchestrator-get-quest-adapter';
import { orchestratorGetQuestAdapterProxy } from './orchestrator-get-quest-adapter.proxy';

describe('orchestratorGetQuestAdapter', () => {
  describe('successful get', () => {
    it('VALID: {questId} => returns GetQuestResult', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();
      const expectedResult = GetQuestResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorGetQuestAdapter({
        questId: 'add-auth',
      });

      expect(result).toStrictEqual(expectedResult);
    });

    it('VALID: {questId, stage} => returns GetQuestResult with stage', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();
      const expectedResult = GetQuestResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorGetQuestAdapter({
        questId: 'add-auth',
        stage: 'spec',
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorGetQuestAdapter({
          questId: 'non-existent',
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
