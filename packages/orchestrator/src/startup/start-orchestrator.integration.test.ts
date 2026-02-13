import { ProcessIdStub, ProjectIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';

import { StartOrchestrator } from './start-orchestrator';

describe('StartOrchestrator', () => {
  describe('listQuests', () => {
    it('ERROR: {invalid projectId} => throws error when quests folder not found', async () => {
      const projectId = ProjectIdStub({ value: '00000000-0000-0000-0000-000000000000' });

      await expect(StartOrchestrator.listQuests({ projectId })).rejects.toThrow(
        /ENOENT|no such file/u,
      );
    });
  });

  describe('loadQuest', () => {
    it('ERROR: {invalid questId} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent-quest' });

      await expect(StartOrchestrator.loadQuest({ questId })).rejects.toThrow(/not found/u);
    });
  });

  describe('startQuest', () => {
    it('ERROR: {invalid questId} => throws error when quest not found', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });

      await expect(StartOrchestrator.startQuest({ questId })).rejects.toThrow(/not found/u);
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
