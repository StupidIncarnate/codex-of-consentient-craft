import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestAdapter } from './orchestrator-get-quest-adapter';
import { orchestratorGetQuestAdapterProxy } from './orchestrator-get-quest-adapter.proxy';

describe('orchestratorGetQuestAdapter', () => {
  describe('successful get', () => {
    it('VALID: {questId, startPath} => returns quest result', async () => {
      orchestratorGetQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      const result = await orchestratorGetQuestAdapter({
        questId: 'test-quest',
        startPath,
      });

      expect(result).toStrictEqual({ quest: {} });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorGetQuestAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(orchestratorGetQuestAdapter({ questId: 'missing', startPath })).rejects.toThrow(
        /Quest not found/u,
      );
    });
  });
});
