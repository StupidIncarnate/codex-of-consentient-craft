import { VerifyQuestResultStub } from '../../../contracts/verify-quest-result/verify-quest-result.stub';

import { orchestratorValidateSpecAdapter } from './orchestrator-validate-spec-adapter';
import { orchestratorValidateSpecAdapterProxy } from './orchestrator-validate-spec-adapter.proxy';

describe('orchestratorValidateSpecAdapter', () => {
  describe('successful validate', () => {
    it('VALID: {questId} => returns VerifyQuestResult', async () => {
      const proxy = orchestratorValidateSpecAdapterProxy();
      const expectedResult = VerifyQuestResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorValidateSpecAdapter({
        questId: 'add-auth',
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorValidateSpecAdapterProxy();

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorValidateSpecAdapter({
          questId: 'non-existent',
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
