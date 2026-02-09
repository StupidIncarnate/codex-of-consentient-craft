import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { AddQuestResultStub } from '../../../contracts/add-quest-result/add-quest-result.stub';

import { orchestratorAddQuestAdapter } from './orchestrator-add-quest-adapter';
import { orchestratorAddQuestAdapterProxy } from './orchestrator-add-quest-adapter.proxy';

describe('orchestratorAddQuestAdapter', () => {
  describe('successful add', () => {
    it('VALID: {title, userRequest, startPath} => returns AddQuestResult', async () => {
      const proxy = orchestratorAddQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });
      const expectedResult = AddQuestResultStub({
        questId: 'add-auth',
        questFolder: '001-add-auth',
        filePath: '/my/project/.dungeonmaster-quests/001-add-auth/quest.json',
      });

      proxy.returns({ result: expectedResult });

      const result = await orchestratorAddQuestAdapter({
        title: 'Add Auth',
        userRequest: 'User wants authentication',
        startPath,
      });

      expect(result).toStrictEqual(expectedResult);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorAddQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.throws({ error: new Error('Failed to add quest') });

      await expect(
        orchestratorAddQuestAdapter({
          title: 'Add Auth',
          userRequest: 'User wants authentication',
          startPath,
        }),
      ).rejects.toThrow(/Failed to add quest/u);
    });
  });
});
