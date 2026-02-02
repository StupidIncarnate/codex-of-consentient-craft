import { FilePathStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from './orchestrator-list-quests-adapter';
import { orchestratorListQuestsAdapterProxy } from './orchestrator-list-quests-adapter.proxy';

describe('orchestratorListQuestsAdapter', () => {
  describe('successful list', () => {
    it('VALID: {startPath} => returns empty array', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });

      proxy.returns({ quests: [] });

      const result = await orchestratorListQuestsAdapter({ startPath });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {startPath with quests} => returns quest list items', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/my/project' });
      const quest = QuestListItemStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
      });

      proxy.returns({ quests: [quest] });

      const result = await orchestratorListQuestsAdapter({ startPath });

      expect(result).toStrictEqual([quest]);
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
