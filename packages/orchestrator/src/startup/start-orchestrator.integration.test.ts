import { GuildPathStub } from '@dungeonmaster/shared/contracts/guild-path/guild-path.stub';
import { ProcessIdStub } from '@dungeonmaster/shared/contracts/process-id/process-id.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../test/harnesses/orchestration-environment/orchestration-environment.harness';

import { StartOrchestrator } from './start-orchestrator';

describe('StartOrchestrator', () => {
  const envHarness = orchestrationEnvironmentHarness();

  describe('bootstrap wiring', () => {
    // StartOrchestrator.bootstrap() returns void (a synchronous void expression cannot be
    // captured into a variable or passed to expect() — @typescript-eslint/no-confusing-void-expression
    // refuses both), and startup/ cannot import state/ to observe the watchers it wires directly.
    // The deep real-effect proofs (each listener actually fires) live in every migrated bootstrap
    // responder's own unit test. This proves the call is reached twice without throwing and leaves
    // a sibling method (getExecutionQueue) working, the same way this file's own stopAllChats test
    // proves that void call via its sibling stopChat.
    it('VALID: {called twice} => starts the passive watchers; getExecutionQueue still resolves', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'start-orch-bootstrap',
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      StartOrchestrator.bootstrap();
      StartOrchestrator.bootstrap();
      const queue = await StartOrchestrator.getExecutionQueue();

      restore();

      expect(queue).toStrictEqual([]);
    });
  });

  describe('guild wiring', () => {
    it('VALID: {listGuilds} => delegates to GuildFlow.list and returns array', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'start-orch-list',
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const result = await StartOrchestrator.listGuilds();

      restore();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('quest wiring', () => {
    it('VALID: {nonexistent questId} => getQuest delegates to QuestFlow.get and returns error', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'start-orch-quest',
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const result = await StartOrchestrator.getQuest({ questId: 'nonexistent-quest-id' });

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
      const testbed = installTestbedCreateBroker({
        baseName: 'start-orch-pause',
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const questId = QuestIdStub({ value: 'nonexistent-quest-id' });

      const thrownError = await StartOrchestrator.pauseQuest({ questId }).catch(
        (error: unknown) => error,
      );

      restore();

      expect(thrownError).toBeInstanceOf(Error);
      expect((thrownError as Error).message).toBe('Quest not found: nonexistent-quest-id');
    });

    it('ERROR: {nonexistent questId} => abandonQuest delegates to OrchestrationFlow.abandon and throws', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: 'start-orch-abandon',
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });
      const questId = QuestIdStub({ value: 'nonexistent-quest-id' });

      const thrownError = await StartOrchestrator.abandonQuest({ questId }).catch(
        (error: unknown) => error,
      );

      restore();

      expect(thrownError).toBeInstanceOf(Error);
      expect((thrownError as Error).message).toBe('Quest not found: nonexistent-quest-id');
    });
  });

  describe('chat wiring', () => {
    it('VALID: {nonexistent chatProcessId} => stopChat delegates to ChatStopFlow and returns false', () => {
      const chatProcessId = ProcessIdStub({ value: 'proc-nonexistent-chat' });

      const result = StartOrchestrator.stopChat({ chatProcessId });

      expect(result).toBe(false);
    });

    it('VALID: {no active chats} => stopAllChats completes and state is empty', () => {
      StartOrchestrator.stopAllChats();

      expect(StartOrchestrator.stopChat({ chatProcessId: 'proc-nonexistent' as never })).toBe(
        false,
      );
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
