import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { GetQuestResultStub } from '../../../contracts/get-quest-result/get-quest-result.stub';

import { orchestratorGetQuestAdapter } from './orchestrator-get-quest-adapter';
import { orchestratorGetQuestAdapterProxy } from './orchestrator-get-quest-adapter.proxy';

describe('orchestratorGetQuestAdapter', () => {
  describe('successful get', () => {
    it('VALID: {questId, startPath} => returns GetQuestResult', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });
      const expectedResult = GetQuestResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorGetQuestAdapter({
        questId: 'add-auth',
        startPath,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorGetQuestAdapter({
          questId: 'non-existent',
          startPath,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
