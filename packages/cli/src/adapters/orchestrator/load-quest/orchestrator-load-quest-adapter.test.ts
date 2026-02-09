/**
 * PURPOSE: Tests for orchestratorLoadQuestAdapter
 */
import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { orchestratorLoadQuestAdapter } from './orchestrator-load-quest-adapter';
import { orchestratorLoadQuestAdapterProxy } from './orchestrator-load-quest-adapter.proxy';

describe('orchestratorLoadQuestAdapter', () => {
  describe('successful loading', () => {
    it('VALID: {questFilePath} => returns quest from orchestrator', async () => {
      const proxy = orchestratorLoadQuestAdapterProxy();
      const questFilePath = FilePathStub({
        value: '/project/.dungeonmaster-quests/001-test/quest.json',
      });
      const quest = QuestStub({
        id: 'test-quest',
        title: 'Test Quest',
        folder: '001-test',
      });

      proxy.returns({ quest });

      const result = await orchestratorLoadQuestAdapter({ questFilePath });

      expect(result).toStrictEqual(quest);
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator error} => throws error', async () => {
      const proxy = orchestratorLoadQuestAdapterProxy();
      const questFilePath = FilePathStub({ value: '/nonexistent/quest.json' });

      proxy.throws({ error: new Error('Failed to load quest') });

      await expect(orchestratorLoadQuestAdapter({ questFilePath })).rejects.toThrow(
        /Failed to load quest/u,
      );
    });
  });
});
