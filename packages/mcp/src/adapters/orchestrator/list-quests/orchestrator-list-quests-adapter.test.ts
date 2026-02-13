import { ProjectIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from './orchestrator-list-quests-adapter';
import { orchestratorListQuestsAdapterProxy } from './orchestrator-list-quests-adapter.proxy';

describe('orchestratorListQuestsAdapter', () => {
  describe('successful list', () => {
    it('VALID: {projectId} => returns empty array', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const projectId = ProjectIdStub();

      proxy.returns({ quests: [] });

      const result = await orchestratorListQuestsAdapter({ projectId });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {projectId with quests} => returns quest list items', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const projectId = ProjectIdStub();
      const quest = QuestListItemStub({
        id: 'add-auth',
        folder: '001-add-auth',
        title: 'Add Authentication',
      });

      proxy.returns({ quests: [quest] });

      const result = await orchestratorListQuestsAdapter({ projectId });

      expect(result).toStrictEqual([quest]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => throws error', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const projectId = ProjectIdStub();

      proxy.throws({ error: new Error('Failed to list quests') });

      await expect(orchestratorListQuestsAdapter({ projectId })).rejects.toThrow(
        /Failed to list quests/u,
      );
    });
  });
});
