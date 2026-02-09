/**
 * PURPOSE: Tests for orchestratorListQuestsAdapter
 */
import { QuestListItemStub } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { orchestratorListQuestsAdapter } from './orchestrator-list-quests-adapter';
import { orchestratorListQuestsAdapterProxy } from './orchestrator-list-quests-adapter.proxy';

describe('orchestratorListQuestsAdapter', () => {
  describe('successful listing', () => {
    it('VALID: {startPath} => returns quests from orchestrator', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/project' });
      const quests = [
        QuestListItemStub({
          id: 'quest-1',
          title: 'First Quest',
          folder: '001-first-quest',
          status: 'pending',
        }),
      ];

      proxy.returns({ quests });

      const result = await orchestratorListQuestsAdapter({ startPath });

      expect(result).toStrictEqual(quests);
    });

    it('VALID: {startPath with no quests} => returns empty array', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/empty-project' });

      proxy.returns({ quests: [] });

      const result = await orchestratorListQuestsAdapter({ startPath });

      expect(result).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator error} => throws error', async () => {
      const proxy = orchestratorListQuestsAdapterProxy();
      const startPath = FilePathStub({ value: '/bad-project' });

      proxy.throws({ error: new Error('Failed to list quests') });

      await expect(orchestratorListQuestsAdapter({ startPath })).rejects.toThrow(
        /Failed to list quests/u,
      );
    });
  });
});
