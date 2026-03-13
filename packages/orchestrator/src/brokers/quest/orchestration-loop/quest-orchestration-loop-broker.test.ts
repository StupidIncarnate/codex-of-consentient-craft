import {
  DependencyStepStub,
  ExecutionLogEntryStub,
  FilePathStub,
  PathseekerRunStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questOrchestrationLoopBroker } from './quest-orchestration-loop-broker';
import { questOrchestrationLoopBrokerProxy } from './quest-orchestration-loop-broker.proxy';

describe('questOrchestrationLoopBroker', () => {
  describe('terminal actions', () => {
    it('VALID: {resolver returns wait-for-user for review_flows} => resolves without modifying quest', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'review_flows' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestWaitForUser({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-1' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {resolver returns wait-for-user for review_observables} => resolves without modifying quest', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'review_observables' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestWaitForUser({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-1b' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {all phases complete} => modifies quest status to complete', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        pathseekerRuns: [PathseekerRunStub({ status: 'complete' })],
        steps: [DependencyStepStub({ status: 'complete' })],
        executionLog: [
          ExecutionLogEntryStub({ agentType: 'ward', status: 'pass' }),
          ExecutionLogEntryStub({ agentType: 'siegemaster', status: 'pass' }),
          ExecutionLogEntryStub({ agentType: 'lawbringer', status: 'pass' }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestComplete({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-2' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {pathseeker failed max attempts} => modifies quest status to blocked', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        pathseekerRuns: [
          PathseekerRunStub({ status: 'failed', attempt: 0 }),
          PathseekerRunStub({ status: 'failed', attempt: 1 }),
          PathseekerRunStub({ status: 'failed', attempt: 2 }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestBlocked({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-3' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('chat actions', () => {
    it('VALID: {resolver returns launch-chat for created quest} => exits loop without launching chat', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'created' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLaunchChat({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-chat-1' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {resolver returns resume-chat for explore_flows with session} => exits loop without launching chat', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'explore_flows',
        questCreatedSessionBy: 'session-123',
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLaunchChat({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-chat-2' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {resolver returns launch-chat for flows_approved} => exits loop without launching chat', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'flows_approved' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLaunchChat({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-chat-3' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('ERROR: {quest not found} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-4' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('abort signal', () => {
    it('VALID: {aborted signal} => writes abort execution log and exits', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'in_progress' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupHalt({ quest });

      const abortController = new AbortController();
      abortController.abort();

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-5' }),
          questId,
          questFilePath: FilePathStub({ value: '/quests/quest.json' }),
          startPath: FilePathStub({ value: '/project/src' }),
          abortSignal: abortController.signal,
        }),
      ).resolves.toBeUndefined();
    });
  });
});
