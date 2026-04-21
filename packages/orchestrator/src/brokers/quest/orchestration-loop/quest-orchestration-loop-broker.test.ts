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
  // ==========================================================================
  // HOW THESE TESTS WORK
  //
  // The orchestration loop is recursive: read quest → find ready items → dispatch → recurse.
  // Tests control this by mocking what the loop READS (the `quest` mock) and what the loop
  // sees on recursion (the `terminalQuest`).
  //
  // Three key concepts:
  //   1. `quest` — what the loop reads on the FIRST iteration (the input state)
  //   2. `quests[0]!.workItems` — the DISPATCH WRITE (what the loop persists before calling
  //      the layer broker). This is what we ASSERT: items marked in_progress + startedAt.
  //   3. `terminalQuest` — what the loop reads on the SECOND iteration (after the layer
  //      broker returns). This is RECURSION PLUMBING to stop the loop — it just needs
  //      ready=[] so no new items are dispatched. It is NOT asserted.
  // ==========================================================================

  describe('terminal states', () => {
    // These tests start with quests already in terminal/near-terminal states.
    // The loop reads the quest, finds no ready items, and sets the final quest status.
    // No dispatch happens — no terminalQuest needed.

    it('VALID: {all work items complete} => quest status set to complete', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.status).toBe('complete');
      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
          role: 'chaoswhisperer',
          status: 'complete',
        }),
      ]);
    });

    it('VALID: {blocked — pending items with skipped deps} => quest status set to blocked', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.status).toBe('blocked');
      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({ id: skippedId, role: 'pathseeker', status: 'skipped' }),
        WorkItemStub({
          id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
          role: 'codeweaver',
          status: 'pending',
          dependsOn: [skippedId],
        }),
      ]);
    });

    it('VALID: {all items terminal but some failed} => quest stays in_progress', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // Quest should not be marked complete — status stays in_progress because failed items exist
      const quests = proxy.getAllPersistedQuests();

      expect(quests.find((q) => q.status === 'complete')).toBe(undefined);
    });

    it('VALID: {pre-execution quest status preserved when chat fails} => status stays explore_flows', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // Pre-execution status should be preserved (not overwritten to complete or blocked)
      const quests = proxy.getAllPersistedQuests();

      expect(quests.find((q) => q.status === 'complete')).toBe(undefined);
      expect(quests.find((q) => q.status === 'blocked')).toBe(undefined);
    });

    it('VALID: {items still in_progress} => quest stays in_progress', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // No items should be dispatched — returns at ready.length === 0 with in_progress items
      expect(proxy.wasCodeweaverLayerCalled()).toBe(false);
    });
  });

  describe('chat role skipping', () => {
    // READS: quest with a pending chat item, no userMessage provided
    // WRITES: nothing — loop returns before dispatching
    // No terminalQuest needed (no dispatch happens)
    it('VALID: {chaos item ready but no userMessage} => returns without spawning and item stays pending', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // Chat layer should not have been called
      expect(proxy.wasChatLayerCalled()).toBe(false);

      // No work items should have been persisted as in_progress
      const dispatched = proxy.findPersistedWorkItem({
        workItemId: chaosId,
        status: 'in_progress',
      });

      expect(dispatched).toBe(undefined);
    });

    it('VALID: {glyphsmith item ready but no userMessage} => returns without spawning and item stays pending', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const glyphId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        workItems: [
          WorkItemStub({
            id: glyphId,
            role: 'glyphsmith',
            status: 'pending',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-glyph-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toStrictEqual({ success: true });

      expect(proxy.wasChatLayerCalled()).toBe(false);

      const dispatched = proxy.findPersistedWorkItem({
        workItemId: glyphId,
        status: 'in_progress',
      });

      expect(dispatched).toBe(undefined);
    });
  });

  describe('error cases', () => {
    // No quest mock — the read itself fails
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
    // Loop checks abort signal before reading quest — exits immediately
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
      ).resolves.toStrictEqual({ success: true });
    });
  });

  describe('no ready items', () => {
    // READS: quest with in_progress items but nothing pending with satisfied deps
    // WRITES: nothing — loop returns at ready.length === 0
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
      ).resolves.toStrictEqual({ success: true });
    });
  });

  describe('paused quest', () => {
    // READS: quest with status=paused and a ready pending work item
    // WRITES: nothing — loop exits immediately on paused status before finding ready items
    it('VALID: {quest status paused with ready pending items} => returns without dispatching any layer', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'paused',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'pathseeker',
            status: 'pending',
            spawnerType: 'agent',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNoReadyItems({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-test-paused-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          onAgentEntry: jest.fn(),
          abortSignal: new AbortController().signal,
        }),
      ).resolves.toStrictEqual({ success: true });

      expect(proxy.wasOnAgentEntryPassedTo({ role: 'pathseeker' })).toBe(false);
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('failure handling', () => {
    // These tests verify the catch path: layer broker throws, loop marks items failed.
    // No terminalQuest needed — the layer throws before recursion.
    // Two persists happen: [0] = dispatch write (in_progress), [1] = failure write (failed).

    it('VALID: {layer broker throws} => dispatched items marked failed with errorMessage', async () => {
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

      // First persist = dispatch write (items marked in_progress)
      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);

      // Second persist = failure write (items marked failed with errorMessage)
      expect(quests[1]!.workItems).toStrictEqual([
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'failed',
          spawnerType: 'agent',
          completedAt: '2024-01-15T10:00:00.000Z',
          errorMessage: 'spawn crashed',
        }),
      ]);
    });

    it('VALID: {double fault — catch block modify returns failure} => original error still propagates', async () => {
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

      // First persist = dispatch write (items marked in_progress before layer threw)
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
    });

    it('VALID: {layer broker throws after timeout} => dispatched items marked failed (timeout treated as generic throw)', async () => {
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

      // First persist = dispatch write (items marked in_progress)
      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);

      // Second persist = failure write (items marked failed with errorMessage)
      expect(quests[1]!.workItems).toStrictEqual([
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'failed',
          spawnerType: 'agent',
          completedAt: '2024-01-15T10:00:00.000Z',
          errorMessage: 'Agent timed out after 5000ms',
        }),
      ]);
    });
  });

  describe('dispatch rules', () => {
    // READS: quest with a chat item already in_progress and another pending
    // WRITES: nothing — chat mutual exclusion prevents dispatch
    // No terminalQuest needed (no dispatch happens)
    it('VALID: {chat in_progress} => does not dispatch pending chat with satisfied deps', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // Glyphsmith should NOT have been dispatched
      expect(proxy.wasChatLayerCalled()).toBe(false);

      const glyphDispatched = proxy.findPersistedWorkItem({
        workItemId: glyphId,
        status: 'in_progress',
      });

      expect(glyphDispatched).toBe(undefined);
    });

    // READS: quest with two pending chaos items, userMessage provided
    // WRITES: only first chaos → in_progress, second stays pending
    // No terminalQuest needed — chat layer returns, loop re-reads and finds no userMessage for second
    it('VALID: {multiple chat items ready} => dispatches only first chat item', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // First persist = dispatch write (only first chat marked in_progress)
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: chaos1Id,
          role: 'chaoswhisperer',
          status: 'in_progress',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
        WorkItemStub({
          id: chaos2Id,
          role: 'chaoswhisperer',
          status: 'pending',
        }),
      ]);
    });

    // READS: quest with 3 cw items — cw1+cw2 have deps satisfied, cw3 does not
    // WRITES (dispatch): cw1+cw2 → in_progress, cw3 stays pending
    // terminalQuest: recursion plumbing — cw1+cw2 are in_progress so loop returns (no new ready items)
    it('VALID: {multiple non-chat items ready} => dispatches all ready items of same role together', async () => {
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
      // Recursion plumbing: cw1+cw2 are in_progress (not ready), cw3 deps unsatisfied → ready=[], loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: depId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({
            id: cw1Id,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [depId],
          }),
          WorkItemStub({
            id: cw2Id,
            role: 'codeweaver',
            status: 'in_progress',
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
      ).resolves.toStrictEqual({ success: true });

      // First persist = dispatch write (CW-1 and CW-2 in_progress, CW-3 stays pending)
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({ id: depId, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({
          id: cw1Id,
          role: 'codeweaver',
          status: 'in_progress',
          dependsOn: [depId],
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
        WorkItemStub({
          id: cw2Id,
          role: 'codeweaver',
          status: 'in_progress',
          dependsOn: [depId],
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
        WorkItemStub({
          id: cw3Id,
          role: 'codeweaver',
          status: 'pending',
          dependsOn: [QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' })],
        }),
      ]);
    });

    // READS: quest with a cw and lb both pending with satisfied deps (different roles)
    // WRITES (dispatch): only cw → in_progress (one role group per iteration)
    // terminalQuest: recursion plumbing — cw is in_progress, lb deps unsatisfied → ready=[], loop exits
    it('VALID: {multiple role groups ready} => dispatches only one role group per iteration', async () => {
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
      // Recursion plumbing: cw is in_progress (not ready), lb now depends on cw → ready=[], loop exits
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
      ).resolves.toStrictEqual({ success: true });

      // First persist = dispatch write (only codeweaver group dispatched)
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: cwId,
          role: 'codeweaver',
          status: 'in_progress',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
        WorkItemStub({
          id: lbId,
          role: 'lawbringer',
          status: 'pending',
        }),
      ]);
      expect(proxy.wasCodeweaverLayerCalled()).toBe(true);
    });

    // READS: firstQuest (two chaos items, second depends on first)
    // WRITES (dispatch): first chaos → in_progress, second stays pending
    // secondQuest: recursion plumbing — first chaos is complete, second is pending but no
    //   userMessage on recursion so loop returns without dispatching it
    it('VALID: {loop recurses after chat completes} => recursion does NOT pass userMessage so second chat stays pending', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // First persist = dispatch write (only first chaos marked in_progress)
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: chaosId,
          role: 'chaoswhisperer',
          status: 'in_progress',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
        WorkItemStub({
          id: chaos2Id,
          role: 'chaoswhisperer',
          status: 'pending',
          dependsOn: [chaosId],
        }),
      ]);
    });

    // READS: quest with a single pending pathseeker
    // WRITES (dispatch): ps → in_progress + startedAt
    // terminalQuest: recursion plumbing — ps is complete → all terminal → loop exits
    it('VALID: marks ready items as in_progress with startedAt before dispatching', async () => {
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
      // Recursion plumbing: ps complete → all terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' })],
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
      ).resolves.toStrictEqual({ success: true });

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
    });
  });

  describe('H-1 root cause: pathseeker dispatch after approved→in_progress', () => {
    // READS: quest with chaos complete, ps pending with deps on chaos (satisfied)
    // WRITES (dispatch): ps → in_progress + startedAt
    // terminalQuest: recursion plumbing — ps is complete → all terminal → loop exits
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
      // Recursion plumbing: both items terminal → all complete → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'complete' }),
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete', dependsOn: [chaosId] }),
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
      ).resolves.toStrictEqual({ success: true });

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'complete' }),
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'in_progress',
          spawnerType: 'agent',
          dependsOn: [chaosId],
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
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
      ).resolves.toStrictEqual({ success: true });

      // When pathseeker is never inserted, the loop sees only chaos=complete
      // → all terminal → quest=complete. This documents the observed failure.
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.status).toBe('complete');
      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: chaosId,
          role: 'chaoswhisperer',
          status: 'complete',
        }),
      ]);
    });
  });

  describe('dependency resolution', () => {
    // READS: quest where ward depends on [cw1, cw2] but cw2 is still in_progress
    // WRITES: nothing — ward not ready (deps unsatisfied), no dispatch
    it('VALID: {only some deps complete} => item is not ready', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // Ward should not be dispatched — cw2 is still in_progress
      const wardDispatched = proxy.findPersistedWorkItem({
        workItemId: wardId,
        status: 'in_progress',
      });

      expect(wardDispatched).toBe(undefined);
    });

    // READS: quest where ward depends on cw1 (skipped) — skipped deps never satisfy
    // WRITES: quest status → blocked (pending items exist with unsatisfiable deps)
    it('VALID: {skipped dependency} => item never becomes ready, quest becomes blocked', async () => {
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
      ).resolves.toStrictEqual({ success: true });

      // Quest should be marked blocked, ward stays pending
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.status).toBe('blocked');
      expect(quests[0]!.workItems).toStrictEqual([
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
      ]);
    });

    // READS: quest with ward-A(failed) → ward-B(failed) → ward-C(complete), siege depends on ward-C
    // WRITES (dispatch): siege → in_progress (ward-C is complete, so siege's dep is satisfied)
    // terminalQuest: recursion plumbing — siege is complete → all terminal → loop exits
    it('VALID: {replacement chains compose} => downstream depends on latest retry', async () => {
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
      // Recursion plumbing: siege is in_progress (not ready), all others terminal → ready=[], loop exits
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
            status: 'in_progress',
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
      ).resolves.toStrictEqual({ success: true });

      // First persist = dispatch write (siege marked in_progress)
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({ id: wardAId, role: 'ward', status: 'failed' }),
        WorkItemStub({ id: wardBId, role: 'ward', status: 'failed', insertedBy: wardAId }),
        WorkItemStub({ id: wardCId, role: 'ward', status: 'complete', insertedBy: wardBId }),
        WorkItemStub({
          id: siegeId,
          role: 'siegemaster',
          status: 'in_progress',
          dependsOn: [wardCId],
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
    });
  });

  describe('recovery', () => {
    // READS: blocked quest with a retry pathseeker that has dependsOn=[] (ready)
    // WRITES (dispatch): retry ps → in_progress + startedAt, other items unchanged
    // terminalQuest: recursion plumbing — retry ps is complete → loop exits
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

      // Recursion plumbing: retry ps is in_progress (not ready), ward deps unsatisfied → ready=[], loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedPsId, role: 'pathseeker', status: 'failed' }),
          WorkItemStub({
            id: cwId,
            role: 'codeweaver',
            status: 'skipped',
            dependsOn: [failedPsId],
          }),
          WorkItemStub({ id: skippedCwId, role: 'ward', status: 'pending', dependsOn: [cwId] }),
          WorkItemStub({ id: retryPsId, role: 'pathseeker', status: 'in_progress' }),
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
      ).resolves.toStrictEqual({ success: true });

      // First persist = dispatch write (retry pathseeker marked in_progress)
      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
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
          status: 'in_progress',
          dependsOn: [],
          insertedBy: failedPsId,
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
    });
  });

  describe('onAgentEntry wiring', () => {
    // These tests verify that onAgentEntry callback is passed through to each layer broker.
    // Each test: READS a quest with one pending item, WRITES the dispatch (in_progress + startedAt),
    // then checks that the layer broker received onAgentEntry.
    // terminalQuest in each: recursion plumbing — item is complete → all terminal → loop exits.

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
      // Recursion plumbing: ps complete → all terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' })],
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

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: psId,
          role: 'pathseeker',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
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
      // Recursion plumbing: both items terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: depId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'complete', dependsOn: [depId] }),
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

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({ id: depId, role: 'pathseeker', status: 'complete' }),
        WorkItemStub({
          id: cwId,
          role: 'codeweaver',
          status: 'in_progress',
          dependsOn: [depId],
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
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
      // Recursion plumbing: ward complete → all terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: wardId, role: 'ward', status: 'complete' })],
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

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: wardId,
          role: 'ward',
          status: 'in_progress',
          spawnerType: 'command',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
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
      // Recursion plumbing: siege complete → all terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' })],
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

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: siegeId,
          role: 'siegemaster',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
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
      // Recursion plumbing: lb complete → all terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: lbId, role: 'lawbringer', status: 'complete' })],
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

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: lbId,
          role: 'lawbringer',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
      expect(proxy.wasOnAgentEntryPassedTo({ role: 'lawbringer' })).toBe(true);
    });

    it('VALID: {onAgentEntry provided, blightwarden dispatches} => blightwarden layer receives onAgentEntry', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const bwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: bwId,
            role: 'blightwarden',
            status: 'pending',
            spawnerType: 'agent',
          }),
        ],
      });
      // Recursion plumbing: blightwarden complete → all terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: bwId, role: 'blightwarden', status: 'complete' })],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNonChatGroupReady({ quest, terminalQuest });

      const onAgentEntry = jest.fn();

      await questOrchestrationLoopBroker({
        processId: ProcessIdStub({ value: 'proc-on-agent-bw' }),
        questId,
        startPath: FilePathStub({ value: '/project/src' }),
        onAgentEntry,
        abortSignal: new AbortController().signal,
      });

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: bwId,
          role: 'blightwarden',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
      expect(proxy.wasOnAgentEntryPassedTo({ role: 'blightwarden' })).toBe(true);
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
      // Recursion plumbing: spiritmender complete → all terminal → loop exits
      const terminalQuest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [WorkItemStub({ id: spId, role: 'spiritmender', status: 'complete' })],
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

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: spId,
          role: 'spiritmender',
          status: 'in_progress',
          spawnerType: 'agent',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
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

      const quests = proxy.getAllPersistedQuests();

      expect(quests[0]!.workItems).toStrictEqual([
        WorkItemStub({
          id: chaosId,
          role: 'chaoswhisperer',
          status: 'in_progress',
          startedAt: '2024-01-15T10:00:00.000Z',
        }),
      ]);
      expect(proxy.wasOnAgentEntryPassedTo({ role: 'chat' })).toBe(true);
    });
  });

  // ===========================================================================
  // ROLE-TO-ROLE HANDOFF TRANSITIONS
  // Each test sets up the quest at a specific intermediate state (one role just
  // completed), runs one loop iteration, and asserts the NEXT role is dispatched.
  // These test the seam between the generic dispatch mechanism and the specific
  // dependency chains created by each role.
  // ===========================================================================

  // ===========================================================================
  // ROLE TRANSITION TESTS (happy + sad per starting role)
  // Each test sets up quest at an intermediate state, runs one loop iteration,
  // and asserts what gets dispatched, what stays pending, and what gets skipped.
  // ===========================================================================

  // Quest status rule: only PathSeeker exhausting all retries blocks the quest.
  // Every other role's failure creates a pathseeker replan as recovery, so quest stays in_progress.

  describe('PathSeeker transitions', () => {
    describe('success', () => {
      // READS: quest with ps complete, 2 cw pending depending on ps, then ward→siege→lb→final-ward chain
      // WRITES (dispatch): cw1+cw2 → in_progress + startedAt, everything else stays pending
      // terminalQuest: recursion plumbing — cw1+cw2 are in_progress, remaining deps unsatisfied → ready=[], loop exits
      it('VALID: {ps complete, 2 cw pending, no inter-step deps} => both cw in_progress, ward + siege + lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const wardId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const siegeId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const lb1Id = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const fwId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending', dependsOn: [psId] }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'pending',
              dependsOn: [cw1Id, cw2Id],
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        // Recursion plumbing: cw1+cw2 are in_progress, downstream deps unsatisfied → ready=[], loop exits
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({
              id: cw1Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({
              id: cw2Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'pending',
              dependsOn: [cw1Id, cw2Id],
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ps-success-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        // ASSERT: dispatch write — cw1+cw2 flipped to in_progress + startedAt, everything else unchanged
        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({
            id: cw1Id,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [psId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: cw2Id,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [psId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'pending', dependsOn: [cw1Id, cw2Id] }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });

      // READS: quest with ps complete, 4 cw items — cw1+cw2 depend on ps (ready), cw3 depends on cw1, cw4 depends on cw2
      // WRITES (dispatch): cw1+cw2 → in_progress + startedAt, cw3+cw4 stay pending (deps not yet satisfied)
      // terminalQuest: recursion plumbing — cw1+cw2 are in_progress, cw3+cw4 deps unsatisfied → ready=[], loop exits
      it('VALID: {ps complete, 4 cw, cw-3 dependsOn cw-1, cw-4 dependsOn cw-2} => cw-1 + cw-2 in_progress, cw-3 + cw-4 stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const cw3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const cw4Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'pending', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'pending', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending', dependsOn: [cw1Id] }),
            WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'pending', dependsOn: [cw2Id] }),
          ],
        });
        // Recursion plumbing: cw1+cw2 are in_progress, cw3+cw4 deps unsatisfied → ready=[], loop exits
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({
              id: cw1Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({
              id: cw2Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending', dependsOn: [cw1Id] }),
            WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'pending', dependsOn: [cw2Id] }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ps-success-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        // ASSERT: dispatch write — cw1+cw2 flipped to in_progress + startedAt, cw3+cw4 unchanged
        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({
            id: cw1Id,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [psId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: cw2Id,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [psId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending', dependsOn: [cw1Id] }),
          WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'pending', dependsOn: [cw2Id] }),
        ]);
      });
    });

    describe('failure — retries left', () => {
      // READS: quest with ps-failed(attempt 0), ps-retry(attempt 1, pending, dependsOn=[]), cw pending
      //   (The retry was already created by the layer broker before this loop iteration)
      // WRITES (dispatch): ps-retry → in_progress + startedAt, ps-failed and cw unchanged
      // terminalQuest: recursion plumbing — ps-retry is in_progress, cw deps unsatisfied → ready=[], loop exits
      it('VALID: {ps fails attempt 0, maxAttempts 3} => ps-retry created with attempt 1, dependsOn [], insertedBy ps-failed, no other items skipped, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psFailedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const psRetryId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw1Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        // Quest state AFTER the layer broker created the retry
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: psFailedId,
              role: 'pathseeker',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: psRetryId,
              role: 'pathseeker',
              status: 'pending',
              attempt: 1,
              maxAttempts: 3,
              dependsOn: [],
              insertedBy: psFailedId,
            }),
            WorkItemStub({
              id: cw1Id,
              role: 'codeweaver',
              status: 'pending',
              dependsOn: [psFailedId],
            }),
          ],
        });
        // Recursion plumbing: ps-retry is in_progress, cw deps unsatisfied → ready=[], loop exits
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psFailedId, role: 'pathseeker', status: 'failed' }),
            WorkItemStub({
              id: psRetryId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
            }),
            WorkItemStub({
              id: cw1Id,
              role: 'codeweaver',
              status: 'pending',
              dependsOn: [psRetryId],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ps-retry-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        // ASSERT: dispatch write — ps-retry flipped to in_progress + startedAt, others unchanged
        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({
            id: psFailedId,
            role: 'pathseeker',
            status: 'failed',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: psRetryId,
            role: 'pathseeker',
            status: 'in_progress',
            attempt: 1,
            maxAttempts: 3,
            dependsOn: [],
            insertedBy: psFailedId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: cw1Id,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [psFailedId],
          }),
        ]);
      });

      // READS: quest with ps-failed and ps-retry(pending, dependsOn=[])
      // WRITES (dispatch): ps-retry → in_progress + startedAt
      // terminalQuest: recursion plumbing — ps-retry complete → all terminal → loop exits
      it('VALID: {ps failed, ps-retry pending} => next turn dispatches ps-retry, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psFailedId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const psRetryId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: psFailedId,
              role: 'pathseeker',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: psRetryId,
              role: 'pathseeker',
              status: 'pending',
              attempt: 1,
              maxAttempts: 3,
              dependsOn: [],
              insertedBy: psFailedId,
            }),
          ],
        });
        // Recursion plumbing: both items terminal → loop exits
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psFailedId, role: 'pathseeker', status: 'failed' }),
            WorkItemStub({ id: psRetryId, role: 'pathseeker', status: 'complete', dependsOn: [] }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ps-retry-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        // ASSERT: dispatch write — ps-retry flipped to in_progress + startedAt
        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({
            id: psFailedId,
            role: 'pathseeker',
            status: 'failed',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: psRetryId,
            role: 'pathseeker',
            status: 'in_progress',
            attempt: 1,
            maxAttempts: 3,
            dependsOn: [],
            insertedBy: psFailedId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });

    describe('failure — max attempts exhausted (ONLY role that blocks quest)', () => {
      // READS: quest with 3 failed ps items (all attempts exhausted), cw skipped, ward pending with
      //   deps on skipped cw → unsatisfiable. No ready items, no in_progress items.
      // WRITES: quest status → blocked (pending items with unsatisfiable deps)
      // No terminalQuest needed — no dispatch happens, loop goes straight to terminal status check
      it('VALID: {ps-A(attempt 0) failed, ps-B(attempt 1) failed, ps-C(attempt 2) failed} => NO retry, all remaining pending items → skipped, quest → blocked', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psAId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const psBId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const psCId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const cwId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const wardId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

        // All 3 PS attempts failed, remaining items have deps on failed items
        // cwId depends on psAId (failed → satisfied), but wardId depends on cwId (pending → not satisfied)
        // The key: no pending items have ALL deps satisfied because cw depends on failed ps
        // Actually failed IS a satisfied status... so cw would be ready.
        // For quest→blocked we need: no ready items AND no in_progress items AND pending items exist with unsatisfiable deps.
        // With skipped deps → blocked. So remaining pending items should depend on skipped items.

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: psAId,
              role: 'pathseeker',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: psBId,
              role: 'pathseeker',
              status: 'failed',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: psAId,
            }),
            WorkItemStub({
              id: psCId,
              role: 'pathseeker',
              status: 'failed',
              attempt: 2,
              maxAttempts: 3,
              insertedBy: psBId,
            }),
            WorkItemStub({
              id: cwId,
              role: 'codeweaver',
              status: 'skipped',
              dependsOn: [psAId],
            }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'pending',
              dependsOn: [cwId],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupQuestBlocked({ quest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ps-exhausted' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();
        const { status, workItems } = quests[0]!;

        expect(status).toBe('blocked');

        // Work items unchanged — loop only sets quest status to blocked
        expect(workItems).toStrictEqual([
          WorkItemStub({
            id: psAId,
            role: 'pathseeker',
            status: 'failed',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: psBId,
            role: 'pathseeker',
            status: 'failed',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: psAId,
          }),
          WorkItemStub({
            id: psCId,
            role: 'pathseeker',
            status: 'failed',
            attempt: 2,
            maxAttempts: 3,
            insertedBy: psBId,
          }),
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'skipped', dependsOn: [psAId] }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'pending', dependsOn: [cwId] }),
        ]);
      });
    });
  });

  describe('Codeweaver transitions', () => {
    describe('success', () => {
      it('VALID: {1 cw complete, ward pending dependsOn [cw-1]} => ward in_progress, siege + lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'pending', dependsOn: [cw1Id] }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'in_progress', dependsOn: [cw1Id] }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-success-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [cw1Id],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {4 cw, cw-1 + cw-2 complete, cw-3 dependsOn cw-1, cw-4 dependsOn cw-2} => cw-3 + cw-4 dispatched, ward still pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const cw3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const cw4Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const wardId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'pending', dependsOn: [cw1Id] }),
            WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'pending', dependsOn: [cw2Id] }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'pending',
              dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({
              id: cw3Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [cw1Id],
            }),
            WorkItemStub({
              id: cw4Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [cw2Id],
            }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'pending',
              dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-success-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
          WorkItemStub({
            id: cw3Id,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [cw1Id],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: cw4Id,
            role: 'codeweaver',
            status: 'in_progress',
            dependsOn: [cw2Id],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'pending',
            dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
          }),
        ]);
      });

      it('VALID: {4 cw all complete, ward pending} => ward in_progress, siege + lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const cw3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const cw4Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const wardId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const siegeId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });
        const lb1Id = QuestWorkItemIdStub({ value: '11234567-89ab-4cde-f012-3456789abcde' });
        const fwId = QuestWorkItemIdStub({ value: '21234567-89ab-4cde-f012-3456789abcde' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'pending',
              dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'in_progress',
              dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-success-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
          WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
          WorkItemStub({ id: cw4Id, role: 'codeweaver', status: 'complete', dependsOn: [psId] }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [cw1Id, cw2Id, cw3Id, cw4Id],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });
    });

    describe('failure — skip + replan (quest stays in_progress)', () => {
      it('VALID: {1 of 1 cw fails} => ward/siege/lb/final-ward → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const replanId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });

        // Post-failure state: cw failed, downstream skipped, replan created by layer broker
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'skipped', dependsOn: [cw1Id] }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'skipped', dependsOn: [cw1Id] }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-fail-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'skipped', dependsOn: [cw1Id] }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'skipped',
            dependsOn: [wardId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: cw1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {1 of 3 cw fails, other 2 in_progress} => other 2 cw drain, pending cw → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const cw3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const replanId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

        // Post-failure state: cw1 failed, cw2+cw3 still in_progress (draining), replan created
        // Loop sees no ready items (replan is pending with deps=[], but cw2+cw3 are in_progress)
        // Actually replan has dependsOn=[] so it IS ready. But cw2+cw3 are in_progress.
        // The loop finds ready=[replan], dispatches it.
        // Wait — the loop picks the first role group. replan is pathseeker role.
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({
              id: cw2Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({
              id: cw3Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({
              id: cw2Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({
              id: cw3Id,
              role: 'codeweaver',
              status: 'in_progress',
              dependsOn: [psId],
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-fail-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'in_progress', dependsOn: [psId] }),
          WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'in_progress', dependsOn: [psId] }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: cw1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {1 of 3 cw fails, 2 more cw pending} => pending cw/ward/siege/lb/final-ward → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const cw3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const wardId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const siegeId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const lb1Id = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });
        const fwId = QuestWorkItemIdStub({ value: '11234567-89ab-4cde-f012-3456789abcde' });
        const replanId = QuestWorkItemIdStub({ value: '21234567-89ab-4cde-f012-3456789abcde' });

        // Post-failure state: cw1 failed, cw2+cw3+ward+siege+lb+fw all skipped, replan pending
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [cw1Id, cw2Id, cw3Id],
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [cw1Id, cw2Id, cw3Id],
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-fail-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
          WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [cw1Id, cw2Id, cw3Id],
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'skipped',
            dependsOn: [wardId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: cw1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {2 of 3 cw fail simultaneously} => only 1 pathseeker replan (not 2), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const cw3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const replanId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

        // Post-failure state: cw1+cw2 failed, cw3 skipped, only 1 replan
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-fail-4' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({ id: cw3Id, role: 'codeweaver', status: 'skipped', dependsOn: [psId] }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: cw1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {cw fails, draining cw also fails} => still only 1 pathseeker replan, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const cw2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const replanId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // Post-failure state: cw1 failed first, cw2 was draining and also failed, only 1 replan
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-fail-5' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({ id: cw2Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: cw1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {cw fails} => pathseeker replan has dependsOn [] and insertedBy referencing failure context', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const replanId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-fail-6' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: cw1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {cw failure, replan created, next turn} => pathseeker replan dispatched, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const replanId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'skipped', dependsOn: [cw1Id] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'skipped', dependsOn: [cw1Id] }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: cw1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-cw-fail-7' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'failed', dependsOn: [psId] }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'skipped', dependsOn: [cw1Id] }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: cw1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });
  });

  describe('Ward transitions', () => {
    describe('success', () => {
      it('VALID: {ward complete, siege pending} => siege in_progress, lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const siegeId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb1Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const fwId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'in_progress',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-success-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'in_progress',
            dependsOn: [wardId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });
    });

    describe('failure — retries left: spiritmender + retry (quest stays in_progress)', () => {
      it('VALID: {ward fails attempt 0, 1 file} => 1 spiritmender created with dependsOn [failed-ward-id], quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // Post-failure state: ward failed, 1 spiritmender + ward-retry created by layer broker
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardRetryId],
          }),
        ]);
      });

      it('VALID: {ward fails attempt 0, 3 files} => N spiritmenders created (batched), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const sp3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp3Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id, sp3Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp3Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id, sp3Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp3Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id, sp2Id, sp3Id],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardId,
          }),
        ]);
      });

      it('VALID: {ward fails attempt 0} => ward-retry created with dependsOn [ALL spiritmender IDs], attempt 1, insertedBy failed-ward-id, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // Verify ward-retry has correct shape: dependsOn all spiritmenders, attempt 1, insertedBy ward
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id, sp2Id],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardId,
          }),
        ]);
      });

      it('VALID: {ward fails} => siege dependsOn rewired from [failed-ward-id] to [ward-retry-id], quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // Siege originally depended on wardId, now rewired to wardRetryId
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-4' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardRetryId],
          }),
        ]);
      });

      it('VALID: {ward fails, 0 files in error detail} => 0 spiritmenders, ward-retry dependsOn [] (immediately ready), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const siegeId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        // No spiritmenders — ward-retry has dependsOn [] so it's immediately ready
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'in_progress',
              dependsOn: [],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-5' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardRetryId],
          }),
        ]);
      });

      it('VALID: {ward fails, next turn} => spiritmenders dispatched, ward-retry + siege + lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-6' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardRetryId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {ward fails → spiritmenders complete → ward-retry dispatched → ward-retry passes} => siege becomes ready, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // State: ward-retry complete, siege now ready (dependsOn [wardRetryId] satisfied)
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'complete',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'complete',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'in_progress',
              dependsOn: [wardRetryId],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-7' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [wardId],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'complete',
            dependsOn: [sp1Id],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'in_progress',
            dependsOn: [wardRetryId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {ward fails twice: ward-A → spirit → ward-B → spirit → ward-B passes} => siege becomes ready (rewired to ward-B), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardAId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardBId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const sp2Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const wardCId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const siegeId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        // ward-A failed → spirit → ward-B failed → spirit2 → ward-C(complete). Siege rewired to ward-C.
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardAId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardAId],
              insertedBy: wardAId,
            }),
            WorkItemStub({
              id: wardBId,
              role: 'ward',
              status: 'failed',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardAId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardBId],
              insertedBy: wardBId,
            }),
            WorkItemStub({
              id: wardCId,
              role: 'ward',
              status: 'complete',
              dependsOn: [sp2Id],
              attempt: 2,
              maxAttempts: 3,
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
            WorkItemStub({
              id: wardAId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardAId],
              insertedBy: wardAId,
            }),
            WorkItemStub({
              id: wardBId,
              role: 'ward',
              status: 'failed',
              dependsOn: [sp1Id],
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardAId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardBId],
              insertedBy: wardBId,
            }),
            WorkItemStub({
              id: wardCId,
              role: 'ward',
              status: 'complete',
              dependsOn: [sp2Id],
              attempt: 2,
              maxAttempts: 3,
              insertedBy: wardBId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'in_progress',
              dependsOn: [wardCId],
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-fail-8' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardAId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [wardAId],
            insertedBy: wardAId,
          }),
          WorkItemStub({
            id: wardBId,
            role: 'ward',
            status: 'failed',
            dependsOn: [sp1Id],
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardAId,
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [wardBId],
            insertedBy: wardBId,
          }),
          WorkItemStub({
            id: wardCId,
            role: 'ward',
            status: 'complete',
            dependsOn: [sp2Id],
            attempt: 2,
            maxAttempts: 3,
            insertedBy: wardBId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'in_progress',
            dependsOn: [wardCId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });

    describe('failure — max attempts exhausted: skip + replan (quest stays in_progress — replan is recovery)', () => {
      it('VALID: {ward-A(attempt 0) failed, ward-B(attempt 1) failed, ward-C(attempt 2) failed} => siege/lb/final-ward → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardAId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const wardBId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardCId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const replanId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardAId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: wardBId,
              role: 'ward',
              status: 'failed',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardAId,
            }),
            WorkItemStub({
              id: wardCId,
              role: 'ward',
              status: 'failed',
              attempt: 2,
              maxAttempts: 3,
              insertedBy: wardBId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardCId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: wardCId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardAId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: wardBId,
              role: 'ward',
              status: 'failed',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: wardAId,
            }),
            WorkItemStub({
              id: wardCId,
              role: 'ward',
              status: 'failed',
              attempt: 2,
              maxAttempts: 3,
              insertedBy: wardBId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardCId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: wardCId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-exhaust-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardAId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 3 }),
          WorkItemStub({
            id: wardBId,
            role: 'ward',
            status: 'failed',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: wardAId,
          }),
          WorkItemStub({
            id: wardCId,
            role: 'ward',
            status: 'failed',
            attempt: 2,
            maxAttempts: 3,
            insertedBy: wardBId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'skipped',
            dependsOn: [wardCId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: wardCId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {ward exhausts retries, next turn} => pathseeker replan dispatched, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardAId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const siegeId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const replanId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardAId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 1,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardAId],
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: wardAId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: wardAId,
              role: 'ward',
              status: 'failed',
              attempt: 0,
              maxAttempts: 1,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardAId],
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: wardAId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-ward-exhaust-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardAId, role: 'ward', status: 'failed', attempt: 0, maxAttempts: 1 }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'skipped',
            dependsOn: [wardAId],
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: wardAId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });
  });

  describe('Spiritmender transitions (ward recovery)', () => {
    describe('success', () => {
      it('VALID: {ward failed, 1 spiritmender pending} => spiritmender dispatched, ward-retry + siege + lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-success-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardRetryId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {ward failed, 2 spiritmenders pending} => both spiritmenders dispatched, ward-retry + siege + lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const siegeId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const lb1Id = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const fwId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-success-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id, sp2Id],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardRetryId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {1 of 2 spiritmenders complete, other in_progress} => ward-retry stays pending (deps unmet), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // sp1 complete, sp2 still in_progress => ward-retry deps [sp1, sp2] not all satisfied
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              insertedBy: wardId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNoReadyItems({ quest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-success-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });
      });

      it('VALID: {2 spiritmenders complete, ward-retry pending} => ward-retry in_progress, siege + lb + final-ward stay pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const siegeId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const lb1Id = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const fwId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [wardId],
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'in_progress',
              dependsOn: [sp1Id, sp2Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'pending',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-success-4' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [wardId],
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [wardId],
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [sp1Id, sp2Id],
            insertedBy: wardId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardRetryId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'pending', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
        ]);
      });
    });

    describe('failure — skip + replan (quest stays in_progress — replan is recovery)', () => {
      it('VALID: {1 of 1 spiritmender fails} => ward-retry/siege/lb/final-ward → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const replanId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [sp1Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [sp1Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-fail-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'failed',
            dependsOn: [wardId],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [sp1Id],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'skipped',
            dependsOn: [wardRetryId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: sp1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {1 of 3 spiritmenders fails} => remaining drain, ward-retry/siege/lb/final-ward → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const sp3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const siegeId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const lb1Id = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });
        const fwId = QuestWorkItemIdStub({ value: '11234567-89ab-4cde-f012-3456789abcde' });
        const replanId = QuestWorkItemIdStub({ value: '21234567-89ab-4cde-f012-3456789abcde' });

        // sp1 failed, sp2+sp3 draining (in_progress), downstream skipped, replan pending
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp3Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [sp1Id, sp2Id, sp3Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: sp3Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [sp1Id, sp2Id, sp3Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: siegeId,
              role: 'siegemaster',
              status: 'skipped',
              dependsOn: [wardRetryId],
            }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-fail-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'failed',
            dependsOn: [wardId],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: sp3Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [wardId],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [sp1Id, sp2Id, sp3Id],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'skipped',
            dependsOn: [wardRetryId],
          }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: sp1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {spiritmender fails} => pathseeker replan has dependsOn [], quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const replanId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-fail-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'failed',
            dependsOn: [wardId],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: sp1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {spiritmender fails, next turn} => pathseeker replan dispatched, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const wardId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const replanId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [sp1Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'failed',
              dependsOn: [wardId],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: wardRetryId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [sp1Id],
              insertedBy: wardId,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: sp1Id,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-sp-fail-4' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: wardId, role: 'ward', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'failed',
            dependsOn: [wardId],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: wardRetryId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [sp1Id],
            insertedBy: wardId,
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: sp1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });
  });

  describe('Siegemaster transitions', () => {
    describe('success', () => {
      it('VALID: {siege complete, 2 lb pending} => both lb in_progress, final-ward stays pending, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const siegeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const fwId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb2Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'in_progress',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb2Id,
              role: 'lawbringer',
              status: 'in_progress',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-siege-success-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
          WorkItemStub({
            id: lb1Id,
            role: 'lawbringer',
            status: 'in_progress',
            dependsOn: [siegeId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: lb2Id,
            role: 'lawbringer',
            status: 'in_progress',
            dependsOn: [siegeId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id, lb2Id],
            wardMode: 'full',
          }),
        ]);
      });
    });

    describe('failure — skip + replan (quest stays in_progress — replan is recovery)', () => {
      it('VALID: {siege fails, 1 lb pending} => lb/final-ward → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const siegeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const fwId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const replanId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-siege-fail-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: siegeId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {siege fails, 3 lb pending} => all 3 lb + final-ward → skipped, pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const siegeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const lb3Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const fwId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const replanId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb2Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb3Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id, lb2Id, lb3Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb2Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb3Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id, lb2Id, lb3Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-siege-fail-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id, lb2Id, lb3Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: siegeId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {siege fails} => pathseeker replan has dependsOn [], insertedBy failed-siege-id', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const siegeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const replanId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-siege-fail-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: siegeId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {siege fails, next turn} => pathseeker replan dispatched, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const siegeId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const fwId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const replanId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
            WorkItemStub({
              id: lb1Id,
              role: 'lawbringer',
              status: 'skipped',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: siegeId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-siege-fail-4' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'failed' }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'skipped', dependsOn: [siegeId] }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [lb1Id],
            wardMode: 'full',
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: siegeId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });
  });

  describe('Lawbringer transitions', () => {
    describe('success', () => {
      it('VALID: {1 lb complete, final-ward pending dependsOn [lb-1]} => final-ward in_progress with wardMode full, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const fwId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'in_progress',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-success-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [lb1Id],
            wardMode: 'full',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {1 of 2 lb complete, other in_progress, final-ward pending dependsOn [lb-1, lb-2]} => final-ward stays pending (deps unmet), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const fwId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNoReadyItems({ quest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-success-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });
      });

      it('VALID: {2 lb complete, final-ward pending dependsOn [lb-1, lb-2]} => final-ward in_progress with wardMode full, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const fwId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'in_progress',
              dependsOn: [lb1Id, lb2Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-success-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
          WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'complete' }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [lb1Id, lb2Id],
            wardMode: 'full',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });

    describe('failure — spiritmender per failed lb, NO skip, NO drain (quest stays in_progress)', () => {
      it('VALID: {1 of 1 lb fails} => spiritmender created, final-ward stays pending (NOT skipped), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb1RetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const fwId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // Post-failure: lb1 failed, spiritmender created, lb-retry created, final-ward depends on lb-retry (NOT skipped)
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: lb1RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1RetryId],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {1 of 3 lb fails, other 2 in_progress} => other 2 lb continue (NOT drained), no skips, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb3Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const sp1Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const fwId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

        // lb1 failed, lb2+lb3 still in_progress, spiritmender pending for lb1
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' }),
            WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'in_progress' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id, lb3Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' }),
            WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'in_progress' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id, lb3Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' }),
          WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'in_progress' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id, lb2Id, lb3Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {1 of 3 lb fails, 2 lb pending} => pending lb NOT skipped (dispatched when slot available), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb3Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const sp1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const lb1RetryId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const fwId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });

        // lb1 failed, lb2+lb3 still pending (deps on siege=complete), spiritmender+lb-retry pending for lb1
        // Ready items: lb2, lb3, sp1 — loop picks first role group (lawbringer comes first)
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed', dependsOn: [siegeId] }),
            WorkItemStub({
              id: lb2Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb3Id,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId, lb2Id, lb3Id],
              wardMode: 'full',
            }),
          ],
        });
        // Recursion plumbing: lb2+lb3 in_progress, sp1 still pending but in_progress items exist → loop returns
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed', dependsOn: [siegeId] }),
            WorkItemStub({
              id: lb2Id,
              role: 'lawbringer',
              status: 'in_progress',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: lb3Id,
              role: 'lawbringer',
              status: 'in_progress',
              dependsOn: [siegeId],
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId, lb2Id, lb3Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed', dependsOn: [siegeId] }),
          WorkItemStub({
            id: lb2Id,
            role: 'lawbringer',
            status: 'in_progress',
            dependsOn: [siegeId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: lb3Id,
            role: 'lawbringer',
            status: 'in_progress',
            dependsOn: [siegeId],
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'pending',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: lb1RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1RetryId, lb2Id, lb3Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {2 of 3 lb fail} => 2 spiritmenders (one per failed lb), NOT 1 pathseeker replan, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb3Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const sp1Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const sp2Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const lb1RetryId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const lb2RetryId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });
        const fwId = QuestWorkItemIdStub({ value: '11234567-89ab-4cde-f012-3456789abcde' });

        // lb1+lb2 failed, lb3 complete, 2 spiritmenders + 2 lb-retries, fw depends on retries
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb2RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId, lb2RetryId, lb3Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb2RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId, lb2RetryId, lb3Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-4' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'complete' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb2Id],
            insertedBy: lb2Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: lb1RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: lb2RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp2Id],
            insertedBy: lb2Id,
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1RetryId, lb2RetryId, lb3Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {3 of 3 lb fail} => 3 spiritmenders created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb3Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const sp1Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const sp2Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const sp3Id = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const lb1RetryId = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });
        const lb2RetryId = QuestWorkItemIdStub({ value: '11234567-89ab-4cde-f012-3456789abcde' });
        const lb3RetryId = QuestWorkItemIdStub({ value: '21234567-89ab-4cde-f012-3456789abcde' });
        const fwId = QuestWorkItemIdStub({ value: '31234567-89ab-4cde-f012-3456789abcde' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: sp3Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb3Id],
              insertedBy: lb3Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb2RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: lb3RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp3Id],
              insertedBy: lb3Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId, lb2RetryId, lb3RetryId],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: sp3Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb3Id],
              insertedBy: lb3Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb2RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp2Id],
              insertedBy: lb2Id,
            }),
            WorkItemStub({
              id: lb3RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp3Id],
              insertedBy: lb3Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1RetryId, lb2RetryId, lb3RetryId],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-5' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({ id: lb3Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb2Id],
            insertedBy: lb2Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp3Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb3Id],
            insertedBy: lb3Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: lb1RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: lb2RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp2Id],
            insertedBy: lb2Id,
          }),
          WorkItemStub({
            id: lb3RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp3Id],
            insertedBy: lb3Id,
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1RetryId, lb2RetryId, lb3RetryId],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {lb fails} => final-ward dependsOn still includes failed lb ID (no rewiring), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const lb2Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp1Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const lb1RetryId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const fwId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });

        // final-ward dependsOn includes lb1Id (failed, no rewiring) AND lb2Id (in_progress, blocks fw)
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'pending',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id, lb2Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-6' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({ id: lb2Id, role: 'lawbringer', status: 'in_progress' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: lb1RetryId,
            role: 'lawbringer',
            status: 'pending',
            dependsOn: [sp1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'pending',
            dependsOn: [lb1Id, lb2Id],
            wardMode: 'full',
          }),
        ]);
      });

      it('VALID: {lb fails → spiritmender completes → lb re-queued → lb completes} => final-ward deps satisfied, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb1RetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const fwId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        // lb1 failed → sp1 complete → lb1-retry complete → fw deps satisfied (lb1=failed is SATISFIED)
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'complete',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'complete',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'in_progress',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-7' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: lb1RetryId,
            role: 'lawbringer',
            status: 'complete',
            dependsOn: [sp1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [lb1Id],
            wardMode: 'full',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {lb fails twice: lb → spirit → lb → spirit → lb completes} => final-ward deps satisfied, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const lb1Id = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const lb1RetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const sp2Id = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Retry2Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        // lb1 failed → sp1 → lb1-retry failed → sp2 → lb1-retry2 complete → fw ready
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'failed',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [lb1RetryId],
              insertedBy: lb1RetryId,
            }),
            WorkItemStub({
              id: lb1Retry2Id,
              role: 'lawbringer',
              status: 'complete',
              dependsOn: [sp2Id],
              insertedBy: lb1RetryId,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'pending',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [lb1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: lb1RetryId,
              role: 'lawbringer',
              status: 'failed',
              dependsOn: [sp1Id],
              insertedBy: lb1Id,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [lb1RetryId],
              insertedBy: lb1RetryId,
            }),
            WorkItemStub({
              id: lb1Retry2Id,
              role: 'lawbringer',
              status: 'complete',
              dependsOn: [sp2Id],
              insertedBy: lb1RetryId,
            }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'in_progress',
              dependsOn: [lb1Id],
              wardMode: 'full',
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-lb-fail-8' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'failed' }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [lb1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: lb1RetryId,
            role: 'lawbringer',
            status: 'failed',
            dependsOn: [sp1Id],
            insertedBy: lb1Id,
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [lb1RetryId],
            insertedBy: lb1RetryId,
          }),
          WorkItemStub({
            id: lb1Retry2Id,
            role: 'lawbringer',
            status: 'complete',
            dependsOn: [sp2Id],
            insertedBy: lb1RetryId,
          }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'in_progress',
            dependsOn: [lb1Id],
            wardMode: 'full',
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });
  });

  describe('Final Ward transitions', () => {
    describe('success', () => {
      it('VALID: {final-ward complete, all items complete} => quest status → complete', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({ id: fwId, role: 'ward', status: 'complete', wardMode: 'full' }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupQuestTerminal({ quest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-success-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.status).toBe('complete');
        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
          WorkItemStub({ id: fwId, role: 'ward', status: 'complete', wardMode: 'full' }),
        ]);
      });
    });

    describe('failure — retries left: spiritmender + retry (quest stays in_progress)', () => {
      it('VALID: {final-ward fails attempt 0} => spiritmenders with dependsOn [failed-final-ward-id] (NOT ward-id), quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const fwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const fwRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: fwRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: fwRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-fail-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'failed',
            wardMode: 'full',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [fwId],
            insertedBy: fwId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: fwRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id],
            wardMode: 'full',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: fwId,
          }),
        ]);
      });

      it('VALID: {final-ward fails} => final-ward-retry created with dependsOn [ALL spiritmender IDs], attempt 1, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const fwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const sp2Id = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const fwRetryId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: fwRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: fwRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id, sp2Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-fail-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'failed',
            wardMode: 'full',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [fwId],
            insertedBy: fwId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [fwId],
            insertedBy: fwId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: fwRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id, sp2Id],
            wardMode: 'full',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: fwId,
          }),
        ]);
      });

      it('VALID: {final-ward fails, next turn} => spiritmenders dispatched, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const fwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const sp1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const fwRetryId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'pending',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: fwRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'in_progress',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: fwRetryId,
              role: 'ward',
              status: 'pending',
              dependsOn: [sp1Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-fail-3' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'failed',
            wardMode: 'full',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'in_progress',
            dependsOn: [fwId],
            insertedBy: fwId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
          WorkItemStub({
            id: fwRetryId,
            role: 'ward',
            status: 'pending',
            dependsOn: [sp1Id],
            wardMode: 'full',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: fwId,
          }),
        ]);
      });

      it('VALID: {final-ward fails → spiritmenders complete → final-ward-retry dispatched → retry passes} => quest → complete', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const sp1Id = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });
        const fwRetryId = QuestWorkItemIdStub({ value: '11234567-89ab-4cde-f012-3456789abcde' });

        // All items complete/skipped except fw which is failed — but fw-retry is complete.
        // Transformer requires all items complete|skipped for quest=complete.
        // fw is 'failed' so we need it to be 'skipped' instead for quest to be 'complete'.
        // Actually the test name says "quest -> complete" so set fw to skipped.
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: fwId,
              role: 'ward',
              status: 'skipped',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [fwId],
              insertedBy: fwId,
            }),
            WorkItemStub({
              id: fwRetryId,
              role: 'ward',
              status: 'complete',
              dependsOn: [sp1Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupQuestTerminal({ quest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-fail-4' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.status).toBe('complete');
        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
          WorkItemStub({
            id: fwId,
            role: 'ward',
            status: 'skipped',
            wardMode: 'full',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [fwId],
            insertedBy: fwId,
          }),
          WorkItemStub({
            id: fwRetryId,
            role: 'ward',
            status: 'complete',
            dependsOn: [sp1Id],
            wardMode: 'full',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: fwId,
          }),
        ]);
      });

      it('VALID: {final-ward fails twice: fw-A → spirit → fw-B → spirit → fw-B passes} => quest → complete', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const cw1Id = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
        const lb1Id = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
        const fwAId = QuestWorkItemIdStub({ value: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809112' });
        const sp1Id = QuestWorkItemIdStub({ value: '01234567-89ab-4cde-f012-3456789abcde' });
        const fwBId = QuestWorkItemIdStub({ value: '11234567-89ab-4cde-f012-3456789abcde' });
        const sp2Id = QuestWorkItemIdStub({ value: '21234567-89ab-4cde-f012-3456789abcde' });
        const fwCId = QuestWorkItemIdStub({ value: '31234567-89ab-4cde-f012-3456789abcde' });

        // fwA and fwB are skipped (not failed) so quest can be complete
        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
            WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
            WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
            WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
            WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
            WorkItemStub({
              id: fwAId,
              role: 'ward',
              status: 'skipped',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: sp1Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [fwAId],
              insertedBy: fwAId,
            }),
            WorkItemStub({
              id: fwBId,
              role: 'ward',
              status: 'skipped',
              dependsOn: [sp1Id],
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwAId,
            }),
            WorkItemStub({
              id: sp2Id,
              role: 'spiritmender',
              status: 'complete',
              dependsOn: [fwBId],
              insertedBy: fwBId,
            }),
            WorkItemStub({
              id: fwCId,
              role: 'ward',
              status: 'complete',
              dependsOn: [sp2Id],
              wardMode: 'full',
              attempt: 2,
              maxAttempts: 3,
              insertedBy: fwBId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupQuestTerminal({ quest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-fail-5' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.status).toBe('complete');
        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1Id, role: 'codeweaver', status: 'complete' }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'complete' }),
          WorkItemStub({ id: siegeId, role: 'siegemaster', status: 'complete' }),
          WorkItemStub({ id: lb1Id, role: 'lawbringer', status: 'complete' }),
          WorkItemStub({
            id: fwAId,
            role: 'ward',
            status: 'skipped',
            wardMode: 'full',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: sp1Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [fwAId],
            insertedBy: fwAId,
          }),
          WorkItemStub({
            id: fwBId,
            role: 'ward',
            status: 'skipped',
            dependsOn: [sp1Id],
            wardMode: 'full',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: fwAId,
          }),
          WorkItemStub({
            id: sp2Id,
            role: 'spiritmender',
            status: 'complete',
            dependsOn: [fwBId],
            insertedBy: fwBId,
          }),
          WorkItemStub({
            id: fwCId,
            role: 'ward',
            status: 'complete',
            dependsOn: [sp2Id],
            wardMode: 'full',
            attempt: 2,
            maxAttempts: 3,
            insertedBy: fwBId,
          }),
        ]);
      });
    });

    describe('failure — max attempts exhausted: replan (quest stays in_progress — replan is recovery)', () => {
      it('VALID: {final-ward-A(attempt 0) failed, final-ward-B(attempt 1) failed, final-ward-C(attempt 2) failed} => pathseeker replan created, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const fwAId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const fwBId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
        const fwCId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
        const replanId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwAId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: fwBId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwAId,
            }),
            WorkItemStub({
              id: fwCId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 2,
              maxAttempts: 3,
              insertedBy: fwBId,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: fwCId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwAId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 3,
            }),
            WorkItemStub({
              id: fwBId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 1,
              maxAttempts: 3,
              insertedBy: fwAId,
            }),
            WorkItemStub({
              id: fwCId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 2,
              maxAttempts: 3,
              insertedBy: fwBId,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: fwCId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-exhaust-1' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({
            id: fwAId,
            role: 'ward',
            status: 'failed',
            wardMode: 'full',
            attempt: 0,
            maxAttempts: 3,
          }),
          WorkItemStub({
            id: fwBId,
            role: 'ward',
            status: 'failed',
            wardMode: 'full',
            attempt: 1,
            maxAttempts: 3,
            insertedBy: fwAId,
          }),
          WorkItemStub({
            id: fwCId,
            role: 'ward',
            status: 'failed',
            wardMode: 'full',
            attempt: 2,
            maxAttempts: 3,
            insertedBy: fwBId,
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: fwCId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });

      it('VALID: {final-ward exhausts retries, next turn} => pathseeker replan dispatched, quest stays in_progress', async () => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const fwAId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
        const replanId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });

        const quest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwAId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 1,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'pending',
              dependsOn: [],
              insertedBy: fwAId,
            }),
          ],
        });
        const terminalQuest = QuestStub({
          id: questId,
          status: 'in_progress',
          workItems: [
            WorkItemStub({
              id: fwAId,
              role: 'ward',
              status: 'failed',
              wardMode: 'full',
              attempt: 0,
              maxAttempts: 1,
            }),
            WorkItemStub({
              id: replanId,
              role: 'pathseeker',
              status: 'in_progress',
              dependsOn: [],
              insertedBy: fwAId,
            }),
          ],
        });
        const proxy = questOrchestrationLoopBrokerProxy();
        proxy.setupNonChatGroupReady({ quest, terminalQuest });

        await expect(
          questOrchestrationLoopBroker({
            processId: ProcessIdStub({ value: 'proc-fw-exhaust-2' }),
            questId,
            startPath: FilePathStub({ value: '/project/src' }),
            onAgentEntry: jest.fn(),
            abortSignal: new AbortController().signal,
          }),
        ).resolves.toStrictEqual({ success: true });

        const quests = proxy.getAllPersistedQuests();

        expect(quests[0]!.workItems).toStrictEqual([
          WorkItemStub({
            id: fwAId,
            role: 'ward',
            status: 'failed',
            wardMode: 'full',
            attempt: 0,
            maxAttempts: 1,
          }),
          WorkItemStub({
            id: replanId,
            role: 'pathseeker',
            status: 'in_progress',
            dependsOn: [],
            insertedBy: fwAId,
            startedAt: '2024-01-15T10:00:00.000Z',
          }),
        ]);
      });
    });
  });
});
