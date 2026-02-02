import { FilePathStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { StartOrchestrator } from './start-orchestrator';

describe('StartOrchestrator', () => {
  describe('listQuests', () => {
    it('ERROR: {invalid startPath} => throws error when quests folder not found', async () => {
      const startPath = FilePathStub({ value: '/nonexistent/path' });

      await expect(StartOrchestrator.listQuests({ startPath })).rejects.toThrow(
        /No package\.json found/u,
      );
    });
  });

  describe('loadQuest', () => {
    it('ERROR: {invalid questId} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent-quest' });
      const startPath = FilePathStub({ value: '/nonexistent/path' });

      await expect(StartOrchestrator.loadQuest({ questId, startPath })).rejects.toThrow(
        /No package\.json found/u,
      );
    });
  });

  describe('startQuest', () => {
    it('ERROR: {invalid startPath} => throws error when quests folder not found', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const startPath = FilePathStub({ value: '/nonexistent/path' });

      await expect(StartOrchestrator.startQuest({ questId, startPath })).rejects.toThrow(
        /No package\.json found/u,
      );
    });
  });

  describe('getQuestStatus', () => {
    it('ERROR: {nonexistent processId} => throws process not found error', () => {
      const processId = ProcessIdStub({ value: 'proc-nonexistent' });

      expect(() => StartOrchestrator.getQuestStatus({ processId })).toThrow(
        /Process not found: proc-nonexistent/u,
      );
    });
  });
});
