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
    it('T-STATUS-1: {all work items complete} => quest status set to complete', async () => {
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      const quests = proxy.getAllPersistedQuests();
      const completedQuest = quests.find((q) => q.status === 'complete');

      expect(completedQuest?.status).toBe('complete');
    });

    it('T-STATUS-2: {blocked — pending items with skipped deps} => quest status set to blocked', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const skippedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: skippedId, role: 'pathseeker', status: 'skipped' }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [skippedId],
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      const quests = proxy.getAllPersistedQuests();
      const blockedQuest = quests.find((q) => q.status === 'blocked');

      expect(blockedQuest?.status).toBe('blocked');
    });

    it('T-STATUS-3: {all items terminal but some failed} => quest stays in_progress', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'pathseeker',
            status: 'complete',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
            role: 'codeweaver',
            status: 'failed',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' }),
            role: 'ward',
            status: 'skipped',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupAllTerminalNotAllComplete({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-status-3' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Quest should not be marked complete — status stays in_progress because failed items exist
      const quests = proxy.getAllPersistedQuests();

      expect(quests.find((q) => q.status === 'complete')).toBeUndefined();
    });

    it('T-STATUS-4: {pre-execution quest status preserved when chat fails} => status stays explore_flows', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'explore_flows',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'chaoswhisperer',
            status: 'failed',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupPreExecutionStatus({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-status-4' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Pre-execution status should be preserved (not overwritten to complete or blocked)
      const quests = proxy.getAllPersistedQuests();

      expect(quests.find((q) => q.status === 'complete')).toBeUndefined();
      expect(quests.find((q) => q.status === 'blocked')).toBeUndefined();
    });

    it('T-STATUS-5: {items still in_progress} => quest stays in_progress', async () => {
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
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
            role: 'codeweaver',
            status: 'failed',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupItemsStillRunning({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-status-5' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // No items should be dispatched — returns at ready.length === 0 with in_progress items
      expect(proxy.wasCodeweaverLayerCalled()).toBe(false);
    });
  });

  describe('chat role skipping', () => {
    it('T-DISPATCH-2: {chaos item ready but no userMessage} => returns without spawning and item stays pending', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [
          WorkItemStub({
            id: chaosId,
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Chat layer should not have been called
      expect(proxy.wasChatLayerCalled()).toBe(false);

      // No work items should have been persisted as in_progress
      const dispatched = proxy.findPersistedWorkItem({
        workItemId: chaosId,
        status: 'in_progress',
      });

      expect(dispatched).toBeUndefined();
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
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
          onAgentEntry: jest.fn(),
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/spawn crashed/u);

      const quests = proxy.getAllPersistedQuests();

      expect(quests.length).toBeGreaterThanOrEqual(1);

      const failedItem = proxy.findPersistedWorkItem({ workItemId: psId, status: 'failed' });

      expect(failedItem?.status).toBe('failed');
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).rejects.toThrow(/Agent timed out/u);

      const quests = proxy.getAllPersistedQuests();

      expect(quests.length).toBeGreaterThanOrEqual(1);

      const failedItem = proxy.findPersistedWorkItem({ workItemId: psId, status: 'failed' });

      expect(failedItem?.status).toBe('failed');
      expect(failedItem?.errorMessage).toBe('Agent timed out after 5000ms');
    });
  });

  describe('dispatch rules', () => {
    it('T-DISPATCH-1: {chat in_progress} => does not dispatch pending chat with satisfied deps', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const glyphId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: chaosId,
            role: 'chaoswhisperer',
            status: 'in_progress',
          }),
          WorkItemStub({
            id: glyphId,
            role: 'glyphsmith',
            status: 'pending',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatMutualExclusion({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dispatch-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'test message' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Glyphsmith should NOT have been dispatched
      expect(proxy.wasChatLayerCalled()).toBe(false);

      const glyphDispatched = proxy.findPersistedWorkItem({
        workItemId: glyphId,
        status: 'in_progress',
      });

      expect(glyphDispatched).toBeUndefined();
    });

    it('T-DISPATCH-3: {multiple chat items ready} => dispatches only first chat item', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaos1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const chaos2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [
          WorkItemStub({
            id: chaos1Id,
            role: 'chaoswhisperer',
            status: 'pending',
          }),
          WorkItemStub({
            id: chaos2Id,
            role: 'chaoswhisperer',
            status: 'pending',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupMultipleChatItemsReady({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dispatch-3' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'build auth flow' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Only the first chaos item should have been dispatched
      const first = proxy.findPersistedWorkItem({ workItemId: chaos1Id, status: 'in_progress' });
      const second = proxy.findPersistedWorkItem({ workItemId: chaos2Id, status: 'in_progress' });

      expect(first?.status).toBe('in_progress');
      expect(second).toBeUndefined();
    });

    it('T-DISPATCH-4: {multiple non-chat items ready} => dispatches all ready items of same role together', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cw2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const cw3Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const depId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: depId,
            role: 'pathseeker',
            status: 'complete',
          }),
          WorkItemStub({
            id: cw1Id,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [depId],
          }),
          WorkItemStub({
            id: cw2Id,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [depId],
          }),
          WorkItemStub({
            id: cw3Id,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' })],
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: depId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [depId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete', dependsOn: [depId] }),
          WorkItemStub({
            id: cw3Id,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' })],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dispatch-4' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // CW-1 and CW-2 should both be dispatched (in_progress), CW-3 stays pending
      const cw1 = proxy.findPersistedWorkItem({ workItemId: cw1Id, status: 'in_progress' });
      const cw2 = proxy.findPersistedWorkItem({ workItemId: cw2Id, status: 'in_progress' });
      const cw3 = proxy.findPersistedWorkItem({ workItemId: cw3Id, status: 'in_progress' });

      expect(cw1?.status).toBe('in_progress');
      expect(cw2?.status).toBe('in_progress');
      expect(cw3).toBeUndefined();
    });

    it('T-DISPATCH-5: {multiple role groups ready} => dispatches only one role group per iteration', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const cwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const lbId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: cwId,
            role: 'codeweaver',
            status: 'pending',
          }),
          WorkItemStub({
            id: lbId,
            role: 'lawbringer',
            status: 'pending',
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({ id: lbId, role: 'lawbringer', status: 'pending', dependsOn: [cwId] }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupMultiRoleGroupsReady({ quest, terminalQuest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dispatch-5' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // The first group in the map is codeweaver (appears first in workItems)
      const cwDispatched = proxy.findPersistedWorkItem({ workItemId: cwId, status: 'in_progress' });

      expect(cwDispatched?.status).toBe('in_progress');
      expect(proxy.wasCodeweaverLayerCalled()).toBe(true);
    });

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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
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

    it('marks ready items as in_progress with startedAt before dispatching', async () => {
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
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: psId,
            role: 'pathseeker',
            status: 'complete',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupSingleDispatch({ quest, terminalQuest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-in-progress' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      const inProgressItem = proxy.findPersistedWorkItem({
        workItemId: psId,
        status: 'in_progress',
      });

      expect(inProgressItem?.status).toBe('in_progress');
      expect(inProgressItem?.startedAt).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('H-1 root cause: pathseeker dispatch after approved→in_progress', () => {
    it('VALID: {chaos complete, pathseeker pending with deps satisfied} => pathseeker marked in_progress with startedAt', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const psId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: chaosId,
            role: 'chaoswhisperer',
            status: 'complete',
          }),
          WorkItemStub({
            id: psId,
            role: 'pathseeker',
            status: 'pending',
            spawnerType: 'agent',
            dependsOn: [chaosId],
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({
            id: psId,
            role: 'pathseeker',
            status: 'complete',
            spawnerType: 'agent',
            dependsOn: [chaosId],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-h1-dispatch' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      const psDispatched = proxy.findPersistedWorkItem({
        workItemId: psId,
        status: 'in_progress',
      });

      expect(psDispatched?.id).toBe(psId);
      expect(psDispatched?.status).toBe('in_progress');
      expect(psDispatched?.startedAt).toBe('2024-01-15T10:00:00.000Z');
    });

    it('VALID: {only chaos complete, no pathseeker} => quest set to complete (H-1 observed failure mode)', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: chaosId,
            role: 'chaoswhisperer',
            status: 'complete',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestTerminal({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-h1-terminal' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // When pathseeker is never inserted, the loop sees only chaos=complete
      // → all terminal → quest=complete. This documents the observed failure.
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]?.status).toBe('complete');
    });
  });

  describe('dependency resolution', () => {
    it('T-DEP-1: {only some deps complete} => item is not ready', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cw2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: cw1Id,
            role: 'codeweaver',
            status: 'complete',
          }),
          WorkItemStub({
            id: cw2Id,
            role: 'codeweaver',
            status: 'in_progress',
          }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'pending',
            dependsOn: [cw1Id, cw2Id],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupPartialDepsComplete({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dep-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Ward should not be dispatched — cw2 is still in_progress
      const wardDispatched = proxy.findPersistedWorkItem({
        workItemId: wardId,
        status: 'in_progress',
      });

      expect(wardDispatched).toBeUndefined();
    });

    it('T-DEP-2: {skipped dependency} => item never becomes ready, quest becomes blocked', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const cw1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const wardId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: cw1Id,
            role: 'codeweaver',
            status: 'skipped',
          }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'pending',
            dependsOn: [cw1Id],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupFailedDep({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dep-2' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Ward should stay pending (not dispatched)
      const wardDispatched = proxy.findPersistedWorkItem({
        workItemId: wardId,
        status: 'in_progress',
      });

      expect(wardDispatched).toBeUndefined();

      // Quest should be marked blocked
      const quests = proxy.getAllPersistedQuests();
      const blockedQuest = quests.find((q) => q.status === 'blocked');

      expect(blockedQuest?.status).toBe('blocked');
    });

    it('T-DEP-5: {replacement chains compose} => downstream depends on latest retry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const wardAId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const wardBId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const wardCId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

      // After two retries, siege originally depended on ward-A.
      // Replacement mapping A->B then B->C means siege should now depend on ward-C.
      // The orchestration loop reads dependsOn as-is from the quest state.
      // So we set up the quest with siege.dependsOn = [wardCId] (the final state after replacements).
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: wardAId,
            role: 'ward',
            status: 'failed',
          }),
          WorkItemStub({
            id: wardBId,
            role: 'ward',
            status: 'failed',
            insertedBy: wardAId,
          }),
          WorkItemStub({
            id: wardCId,
            role: 'ward',
            status: 'complete',
            insertedBy: wardBId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardCId],
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: wardAId, role: 'ward', status: 'failed' }),
          WorkItemStub({ id: wardBId, role: 'ward', status: 'failed', insertedBy: wardAId }),
          WorkItemStub({ id: wardCId, role: 'ward', status: 'complete', insertedBy: wardBId }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'complete',
            dependsOn: [wardCId],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-dep-5' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // Siege should be dispatched because its dependency (ward-C) is complete
      const siegeDispatched = proxy.findPersistedWorkItem({
        workItemId: siegeId,
        status: 'in_progress',
      });

      expect(siegeDispatched?.status).toBe('in_progress');
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

      const skippedCwId = QuestWorkItemIdStub({
        value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
      });

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
            status: 'skipped',
            dependsOn: [failedPsId],
          }),
          WorkItemStub({
            id: skippedCwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [cwId],
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
            status: 'skipped',
            dependsOn: [failedPsId],
          }),
          WorkItemStub({
            id: skippedCwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [cwId],
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
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toBeUndefined();

      // The retry pathseeker should have been marked in_progress (dispatched)
      const retryDispatched = proxy.findPersistedWorkItem({
        workItemId: retryPsId,
        status: 'in_progress',
      });

      expect(retryDispatched?.status).toBe('in_progress');
    });
  });

  describe('onAgentEntry wiring', () => {
    it('VALID: {onAgentEntry provided, pathseeker dispatches} => pathseeker layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'pending', spawnerType: 'agent' }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: psId,
            role: 'pathseeker',
            status: 'complete',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-ps' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'pathseeker' })).toBe(true);
    });

    it('VALID: {onAgentEntry provided, codeweaver dispatches} => codeweaver layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const depId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
      const cwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: depId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({
            id: cwId,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [depId],
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: depId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({
            id: cwId,
            role: 'codeweaver',
            status: 'complete',
            dependsOn: [depId],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-cw' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'codeweaver' })).toBe(true);
    });

    it('VALID: {onAgentEntry provided, ward dispatches} => ward layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: wardId, role: 'ward', status: 'pending', spawnerType: 'command' }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-ward' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'ward' })).toBe(true);
    });

    it('VALID: {onAgentEntry provided, siegemaster dispatches} => siegemaster layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const siegeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            spawnerType: 'agent',
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'complete',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-siege' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'siegemaster' })).toBe(true);
    });

    it('VALID: {onAgentEntry provided, lawbringer dispatches} => lawbringer layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const lbId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: lbId,
            role: 'lawbringer',
            status: 'pending',
            spawnerType: 'agent',
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: lbId,
            role: 'lawbringer',
            status: 'complete',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-lb' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'lawbringer' })).toBe(true);
    });

    it('VALID: {onAgentEntry provided, spiritmender dispatches} => spiritmender layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const spId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: spId,
            role: 'spiritmender',
            status: 'pending',
            spawnerType: 'agent',
          }),
        ],
      });
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: spId,
            role: 'spiritmender',
            status: 'complete',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-sp' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'spiritmender' })).toBe(true);
    });

    it('VALID: {onAgentEntry provided, chat dispatches} => chat layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'pending' })],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupMultipleChatItemsReady({ quest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-chat' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        userMessage: UserInputStub({ value: 'test' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'chat' })).toBe(true);
    });
  });
});
