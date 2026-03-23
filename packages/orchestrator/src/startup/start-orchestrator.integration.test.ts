import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { GuildPathStub, ProcessIdStub, QuestIdStub } from '@dungeonmaster/shared/contracts';
import { environmentStatics } from '@dungeonmaster/shared/statics';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { StartOrchestrator } from './start-orchestrator';

const setupTestHome = ({ baseName }: { baseName: string }): (() => void) => {
  const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;
  const testbed = installTestbedCreateBroker({
    baseName: BaseNameStub({ value: baseName }),
  });
  process.env.DUNGEONMASTER_HOME = testbed.guildPath;
  const dmDir = join(testbed.guildPath, environmentStatics.testDataDir);
  mkdirSync(dmDir, { recursive: true });
  writeFileSync(join(dmDir, 'config.json'), JSON.stringify({ guilds: [] }));

  return (): void => {
    if (savedDungeonmasterHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
    }
  };
};

describe('StartOrchestrator', () => {
  describe('guild wiring', () => {
    it('VALID: {listGuilds} => delegates to GuildFlow.list and returns array', async () => {
      const restore = setupTestHome({ baseName: 'start-orch-list' });

      const result = await StartOrchestrator.listGuilds();

      restore();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('quest wiring', () => {
    it('VALID: {nonexistent questId} => getQuest delegates to QuestFlow.get and returns error', async () => {
      const restore = setupTestHome({ baseName: 'start-orch-quest' });

      const result = await StartOrchestrator.getQuest({ questId: 'nonexistent-quest-id' });

      restore();

      expect(result.success).toBe(false);
    });

    it('VALID: {nonexistent questId} => verifyQuest delegates to QuestFlow.verify and returns error', async () => {
      const restore = setupTestHome({ baseName: 'start-orch-verify' });

      const result = await StartOrchestrator.verifyQuest({ questId: 'nonexistent-quest-id' });

      restore();

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

    it('ERROR: {nonexistent questId} => pauseQuest delegates to OrchestrationFlow.pause and throws', async () => {
      const restore = setupTestHome({ baseName: 'start-orch-pause' });
      const questId = QuestIdStub({ value: 'nonexistent-quest-id' });

      const thrownError = await StartOrchestrator.pauseQuest({ questId }).catch(
        (error: unknown) => error,
      );

      restore();

      expect(thrownError).toBeInstanceOf(Error);
      expect((thrownError as Error).message).toMatch(/Quest not found/u);
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
