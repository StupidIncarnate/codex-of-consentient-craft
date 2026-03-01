import { GuildPathStub, ProcessIdStub } from '@dungeonmaster/shared/contracts';

import { StartOrchestrator } from './start-orchestrator';

describe('StartOrchestrator', () => {
  describe('guild wiring', () => {
    it('VALID: {listGuilds} => delegates to GuildFlow.list and returns array', async () => {
      const result = await StartOrchestrator.listGuilds();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('quest wiring', () => {
    it('VALID: {nonexistent questId} => getQuest delegates to QuestFlow.get and returns error', async () => {
      const result = await StartOrchestrator.getQuest({ questId: 'nonexistent-quest-id' });

      expect(result.success).toBe(false);
    });

    it('VALID: {nonexistent questId} => verifyQuest delegates to QuestFlow.verify and returns error', async () => {
      const result = await StartOrchestrator.verifyQuest({ questId: 'nonexistent-quest-id' });

      expect(result.success).toBe(false);
    });
  });

  describe('orchestration wiring', () => {
    it('ERROR: {nonexistent processId} => getQuestStatus delegates to OrchestrationFlow.getStatus and throws', () => {
      const processId = ProcessIdStub({ value: 'proc-nonexistent' });

      expect(() => StartOrchestrator.getQuestStatus({ processId })).toThrow(
        /Process not found: proc-nonexistent/u,
      );
    });
  });

  describe('chat wiring', () => {
    it('VALID: {nonexistent chatProcessId} => stopChat delegates to ChatStopFlow and returns false', () => {
      const chatProcessId = ProcessIdStub({ value: 'proc-nonexistent-chat' });

      const result = StartOrchestrator.stopChat({ chatProcessId });

      expect(result).toBe(false);
    });

    it('VALID: {no active chats} => stopAllChats delegates to ChatStopAllFlow without error', () => {
      expect(() => {
        StartOrchestrator.stopAllChats();
      }).not.toThrow();
    });
  });

  describe('directory wiring', () => {
    it('VALID: {path: undefined} => browseDirectories delegates to DirectoryFlow and returns entries', () => {
      const result = StartOrchestrator.browseDirectories({});

      expect(Array.isArray(result)).toBe(true);
    });

    it('ERROR: {path: nonexistent} => browseDirectories delegates to DirectoryFlow and throws ENOENT', () => {
      const path = GuildPathStub({ value: '/nonexistent/path/that/does/not/exist' });

      expect(() => StartOrchestrator.browseDirectories({ path })).toThrow(/ENOENT|no such file/u);
    });
  });
});
