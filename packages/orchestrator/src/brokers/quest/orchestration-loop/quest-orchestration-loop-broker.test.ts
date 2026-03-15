import {
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questOrchestrationLoopBroker } from './quest-orchestration-loop-broker';
import { questOrchestrationLoopBrokerProxy } from './quest-orchestration-loop-broker.proxy';

describe('questOrchestrationLoopBroker', () => {
  describe('terminal states', () => {
    it('VALID: {all work items complete} => resolves without error', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestTerminal({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {blocked — pending items with failed deps} => sets quest status to blocked', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const failedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedId, role: 'pathseeker', status: 'failed' }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [failedId],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestBlocked({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-2' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('chat role skipping', () => {
    it('VALID: {chaos item ready but no userMessage} => returns without spawning (auto-recovery skip)', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'chaoswhisperer',
            status: 'pending',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-3' }),
          questId,
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
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });

  describe('abort signal', () => {
    it('VALID: {aborted signal} => exits immediately', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupAborted();

      const abortController = new AbortController();
      abortController.abort();

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-5' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          abortSignal: abortController.signal,
        }),
      ).resolves.toBeUndefined();
    });
  });

  describe('no ready items', () => {
    it('VALID: {items in_progress but none ready} => returns without dispatching', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'codeweaver',
            status: 'in_progress',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNoReadyItems({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-6' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();
    });
  });
});
