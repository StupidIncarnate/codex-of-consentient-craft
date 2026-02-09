import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
import { ModifyQuestResultStub } from '../../../contracts/modify-quest-result/modify-quest-result.stub';

import { orchestratorModifyQuestAdapter } from './orchestrator-modify-quest-adapter';
import { orchestratorModifyQuestAdapterProxy } from './orchestrator-modify-quest-adapter.proxy';

describe('orchestratorModifyQuestAdapter', () => {
  describe('successful modify', () => {
    it('VALID: {questId, input, startPath} => returns ModifyQuestResult', async () => {
      const proxy = orchestratorModifyQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });
      const input = ModifyQuestInputStub({ questId: 'add-auth' });
      const expectedResult = ModifyQuestResultStub();

      proxy.returns({ result: expectedResult });

      const result = await orchestratorModifyQuestAdapter({
        questId: 'add-auth',
        input,
        startPath,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorModifyQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });
      const input = ModifyQuestInputStub({ questId: 'non-existent' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(
        orchestratorModifyQuestAdapter({
          questId: 'non-existent',
          input,
          startPath,
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
