import { ProjectIdStub, QuestListItemStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from './orchestrator-list-quests-adapter';
import { orchestratorListQuestsAdapterProxy } from './orchestrator-list-quests-adapter.proxy';

describe('orchestratorListQuestsAdapter', () => {
  describe('successful list', () => {
    it('VALID: {projectId} => returns quest list items', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const projectId = ProjectIdStub();
      const quests = [QuestListItemStub()];

      proxy.returns({ quests });

      const result = await orchestratorListQuestsAdapter({ projectId });

      expect(result).toStrictEqual(quests);
    });

    it('VALID: {projectId, no quests} => returns empty array', async () => {
      orchestratorListQuestsAdapterProxy();
      const projectId = ProjectIdStub();

      const result = await orchestratorListQuestsAdapter({ projectId });

      expect(result).toStrictEqual([]);
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
