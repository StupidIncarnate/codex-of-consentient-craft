import { FilePathStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { orchestratorStartQuestAdapter } from './orchestrator-start-quest-adapter';
import { orchestratorStartQuestAdapterProxy } from './orchestrator-start-quest-adapter.proxy';

describe('orchestratorStartQuestAdapter', () => {
  describe('successful start', () => {
    it('VALID: {questId, startPath} => returns processId', async () => {
      const proxy = orchestratorStartQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const startPath = FilePathStub({ value: '/my/project' });
      const processId = ProcessIdStub({ value: 'proc-123' });

      proxy.returns({ processId });

      const result = await orchestratorStartQuestAdapter({ questId, startPath });

      expect(result).toBe(processId);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorStartQuestAdapterProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.throws({ error: new Error('Quest not found') });

      await expect(orchestratorStartQuestAdapter({ questId, startPath })).rejects.toThrow(
        /Quest not found/u,
      );
    });
  });
});
