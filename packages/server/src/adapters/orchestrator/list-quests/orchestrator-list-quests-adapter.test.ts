import { FilePathStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from './orchestrator-list-quests-adapter';
import { orchestratorListQuestsAdapterProxy } from './orchestrator-list-quests-adapter.proxy';

describe('orchestratorListQuestsAdapter', () => {
  describe('successful list', () => {
    it('VALID: {startPath} => returns quest list items', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });
      const quests = [QuestListItemStub()];

      proxy.returns({ quests });

      const result = await orchestratorListQuestsAdapter({ startPath });

      expect(result).toStrictEqual(quests);
    });

    it('VALID: {startPath, no quests} => returns empty array', async () => {
      orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      const result = await orchestratorListQuestsAdapter({ startPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.throws({ error: new Error('Failed to list quests') });

      await expect(orchestratorListQuestsAdapter({ startPath })).rejects.toThrow(
        /Failed to list quests/u,
      );
    });
  });
});
