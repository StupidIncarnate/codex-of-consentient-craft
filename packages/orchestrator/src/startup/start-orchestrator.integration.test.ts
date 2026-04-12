import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildPathStub,
  ObservableIdStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';

import { orchestrationEnvironmentHarness } from '../../test/harnesses/orchestration-environment/orchestration-environment.harness';
import { questSeedHarness } from '../../test/harnesses/quest-seed/quest-seed.harness';

import { StartOrchestrator } from './start-orchestrator';

describe('StartOrchestrator', () => {
  const envHarness = orchestrationEnvironmentHarness();
  const seeder = questSeedHarness();

  describe('guild wiring', () => {
    it('VALID: {listGuilds} => delegates to GuildFlow.list and returns array', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-orch-list' }),
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
        baseName: BaseNameStub({ value: 'start-orch-quest' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const result = await StartOrchestrator.getQuest({ questId: 'nonexistent-quest-id' });

      restore();

      expect(result.success).toBe(false);
    });

    it('VALID: {nonexistent questId} => verifyQuest delegates to QuestFlow.verify and returns error', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-orch-verify' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const result = await StartOrchestrator.verifyQuest({ questId: 'nonexistent-quest-id' });

      restore();

      expect(result.success).toBe(false);
    });
  });

  describe('validate-spec wiring', () => {
    it('VALID: {existing quest with valid spec} => validateSpec returns success true with checks', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-orch-valspec-ok' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const obs = FlowObservableStub({
        id: ObservableIdStub({ value: 'obs-valspec' }),
      });
      const nodeA = FlowNodeStub({
        id: 'node-a' as ReturnType<typeof FlowNodeStub>['id'],
        label: 'Node A',
        type: 'state',
        observables: [],
      });
      const nodeB = FlowNodeStub({
        id: 'node-b' as ReturnType<typeof FlowNodeStub>['id'],
        label: 'Node B',
        type: 'terminal',
        observables: [obs],
      });
      const edge = FlowEdgeStub({ from: nodeA.id, to: nodeB.id });
      const flows = [FlowStub({ nodes: [nodeA, nodeB], edges: [edge] })];

      const quest = QuestStub({
        id: 'valspec-quest',
        folder: '001-valspec-quest',
        flows,
      });

      seeder.seed({ tempDir: testbed.guildPath, quest });

      const result = await StartOrchestrator.validateSpec({ questId: 'valspec-quest' });

      testbed.cleanup();
      restore();

      expect(result.success).toBe(true);
      expect(result.checks.length > 0).toBe(true);
      expect(result.checks.every((check) => check.passed === true)).toBe(true);
    });

    it('ERROR: {nonexistent questId} => validateSpec returns failure with error and empty checks', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'start-orch-valspec-err' }),
      });
      const { restore } = envHarness.setupHome({ tempDir: testbed.guildPath });

      const result = await StartOrchestrator.validateSpec({ questId: 'nonexistent-quest-id' });

      testbed.cleanup();
      restore();

      expect(result).toStrictEqual({
        success: false,
        checks: [],
        error: 'Unknown error',
      });
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
        baseName: BaseNameStub({ value: 'start-orch-pause' }),
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
