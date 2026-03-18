import {
  FilePathStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  UserInputStub,
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

  describe('failure handling', () => {
    it('T-FAIL-1: {layer broker throws} => dispatched items marked failed with errorMessage', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: psId,
            role: 'pathseeker',
            status: 'pending',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLayerThrows({ quest, error: new Error('spawn crashed') });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-fail-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).rejects.toThrow(/spawn crashed/u);

      const quests = proxy.getAllPersistedQuests();

      expect(quests.length).toBeGreaterThanOrEqual(1);

      const failedItem = proxy.findPersistedWorkItem({ workItemId: psId, status: 'failed' });

      expect(failedItem).toBeDefined();
      expect(failedItem?.errorMessage).toBe('spawn crashed');
    });

    it('T-FAIL-3: {double fault — catch block modify returns failure} => original error still propagates', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: psId,
            role: 'pathseeker',
            status: 'pending',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLayerThrowsWithCatchFailure({
        quest,
        error: new Error('original layer error'),
      });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-fail-3' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).rejects.toThrow(/original layer error/u);
    });

    it('T-FAIL-6: {layer broker throws after timeout} => dispatched items marked failed (timeout treated as generic throw)', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: psId,
            role: 'pathseeker',
            status: 'pending',
            spawnerType: 'agent',
            timeoutMs: 5000,
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLayerThrows({
        quest,
        error: new Error('Agent timed out after 5000ms'),
      });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-fail-6' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).rejects.toThrow(/Agent timed out/u);

      const quests = proxy.getAllPersistedQuests();

      expect(quests.length).toBeGreaterThanOrEqual(1);

      const failedItem = proxy.findPersistedWorkItem({ workItemId: psId, status: 'failed' });

      expect(failedItem).toBeDefined();
      expect(failedItem?.errorMessage).toBe('Agent timed out after 5000ms');
    });
  });

  describe('dispatch rules', () => {
    it('T-DISPATCH-7: {loop recurses after chat completes} => recursion does NOT pass userMessage so second chat stays pending', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const chaos2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });

      const firstQuest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [
          WorkItemStub({
            id: chaosId,
            role: 'chaoswhisperer',
            status: 'pending',
          }),
          WorkItemStub({
            id: chaos2Id,
            role: 'chaoswhisperer',
            status: 'pending',
            dependsOn: [chaosId],
          }),
        ],
      });

      const secondQuest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [
          WorkItemStub({
            id: chaosId,
            role: 'chaoswhisperer',
            status: 'complete',
          }),
          WorkItemStub({
            id: chaos2Id,
            role: 'chaoswhisperer',
            status: 'pending',
          }),
        ],
      });

      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatDispatchWithRecursion({ firstQuest, secondQuest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dispatch-7' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'build auth flow' }),
        }),
      ).resolves.toBeUndefined();

      // Only the first chaos item should have been marked in_progress (dispatched).
      // The second chaos item should never be dispatched because recursion omits userMessage.
      const secondChatDispatched = proxy.findPersistedWorkItem({
        workItemId: chaos2Id,
        status: 'in_progress',
      });

      expect(secondChatDispatched).toBeUndefined();
    });
  });

  describe('recovery', () => {
    it('VALID: {quest blocked with new ready items} => dispatches ready items and recovers from blocked', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const failedPsId = QuestWorkItemIdStub({
        value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      });
      const retryPsId = QuestWorkItemIdStub({
        value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      });
      const cwId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });

      const blockedQuest = QuestStub({
        id: questId,
        status: 'blocked',
        workItems: [
          WorkItemStub({
            id: failedPsId,
            role: 'pathseeker',
            status: 'failed',
          }),
          WorkItemStub({
            id: cwId,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [failedPsId],
          }),
          WorkItemStub({
            id: retryPsId,
            role: 'pathseeker',
            status: 'pending',
            dependsOn: [],
            insertedBy: failedPsId,
          }),
        ],
      });

      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: failedPsId,
            role: 'pathseeker',
            status: 'failed',
          }),
          WorkItemStub({
            id: cwId,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [failedPsId],
          }),
          WorkItemStub({
            id: retryPsId,
            role: 'pathseeker',
            status: 'complete',
          }),
        ],
      });

      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupRecoveryFromBlocked({ blockedQuest, terminalQuest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-recovery' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      // The retry pathseeker should have been marked in_progress (dispatched)
      const retryDispatched = proxy.findPersistedWorkItem({
        workItemId: retryPsId,
        status: 'in_progress',
      });

      expect(retryDispatched).toBeDefined();
    });
  });
});
