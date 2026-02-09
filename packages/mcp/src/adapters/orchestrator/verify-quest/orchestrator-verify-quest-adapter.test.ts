import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { VerifyQuestResultStub } from '../../../contracts/verify-quest-result/verify-quest-result.stub';

import { orchestratorVerifyQuestAdapter } from './orchestrator-verify-quest-adapter';
import { orchestratorVerifyQuestAdapterProxy } from './orchestrator-verify-quest-adapter.proxy';

describe('orchestratorVerifyQuestAdapter', () => {
  describe('successful verify', () => {
    it('VALID: {questId, startPath} => returns VerifyQuestResult', async () => {
      const proxy = orchestratorVerifyQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });
      const expectedResult = VerifyQuestResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorVerifyQuestAdapter({
        questId: 'add-auth',
        startPath,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorVerifyQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorVerifyQuestAdapter({
          questId: 'non-existent',
          startPath,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
