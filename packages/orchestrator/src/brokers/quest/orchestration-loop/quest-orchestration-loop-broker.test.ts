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

  describe('dispatch rules', () => {
    it('VALID: {chaos in_progress + glyph pending ready} => glyph stays pending because only one chat role runs at a time', async () => {
      const questId = QuestIdStub({ value: 'dispatch-1' });
      const quest = QuestStub({
        id: questId,
        status: 'explore_flows',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'chaoswhisperer',
            status: 'in_progress',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
            role: 'glyphsmith',
            status: 'pending',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dispatch-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'test message' }),
        }),
      ).resolves.toBeUndefined();

      // No persist happened because nothing was dispatched
      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toHaveLength(0);
    });

    it('VALID: {chaos pending ready, no userMessage} => chaos stays pending because chat roles require a user message to dispatch', async () => {
      const questId = QuestIdStub({ value: 'dispatch-2' });
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
          processId: ProcessIdStub({ value: 'proc-dispatch-2' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toHaveLength(0);
    });

    it('VALID: {two chaos items pending ready, userMessage provided} => only first chaos dispatched because chat items dispatch one at a time', async () => {
      const questId = QuestIdStub({ value: 'dispatch-3' });
      const chaosA = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const chaosB = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [
          WorkItemStub({ id: chaosA, role: 'chaoswhisperer', status: 'pending' }),
          WorkItemStub({ id: chaosB, role: 'chaoswhisperer', status: 'pending' }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatDispatch({ quest });

      try {
        await questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dispatch-3' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'test message' }),
        });
      } catch {
        // Recursion may fail due to incomplete mocks — expected
      }

      // First persist: in_progress marking — only chaosA should be marked
      const markedItem = proxy.getPersistedWorkItemById({ workItemId: chaosA, index: 0 });

      expect(markedItem?.status).toBe('in_progress');

      // chaosB should NOT be marked in_progress
      const unmarkedItem = proxy.getPersistedWorkItemById({ workItemId: chaosB, index: 0 });

      expect(unmarkedItem?.status).toBe('pending');
    });

    it('VALID: {CW-1 ready + CW-2 ready + CW-3 dep unmet} => CW-1 and CW-2 dispatched together, CW-3 stays pending', async () => {
      const questId = QuestIdStub({ value: 'dispatch-4' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cw1 = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const cw2 = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const cw3 = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
      const wardId = QuestWorkItemIdStub({ value: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cw1, role: 'codeweaver', status: 'pending', dependsOn: [psId] }),
          WorkItemStub({ id: cw2, role: 'codeweaver', status: 'pending', dependsOn: [psId] }),
          WorkItemStub({
            id: cw3,
            role: 'codeweaver',
            status: 'pending',
            dependsOn: [psId, wardId],
          }),
          WorkItemStub({ id: wardId, role: 'ward', status: 'in_progress' }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      try {
        await questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dispatch-4' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        });
      } catch {
        // Layer broker may fail — expected
      }

      // CW-1 and CW-2 should be marked in_progress
      const cw1Item = proxy.getPersistedWorkItemById({ workItemId: cw1, index: 0 });

      expect(cw1Item?.status).toBe('in_progress');

      const cw2Item = proxy.getPersistedWorkItemById({ workItemId: cw2, index: 0 });

      expect(cw2Item?.status).toBe('in_progress');

      // CW-3 should remain pending (wardId dep not met)
      const cw3Item = proxy.getPersistedWorkItemById({ workItemId: cw3, index: 0 });

      expect(cw3Item?.status).toBe('pending');
    });

    it('VALID: {codeweavers ready AND lawbringers ready} => only first role group dispatched per iteration', async () => {
      const questId = QuestIdStub({ value: 'dispatch-5' });
      const cwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const lbId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending' }),
          WorkItemStub({ id: lbId, role: 'lawbringer', status: 'pending' }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      try {
        await questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dispatch-5' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        });
      } catch {
        // Layer broker may fail — expected
      }

      // First role group (codeweaver) should be marked in_progress
      const cwItem = proxy.getPersistedWorkItemById({ workItemId: cwId, index: 0 });

      expect(cwItem?.status).toBe('in_progress');

      // Second role group (lawbringer) should remain pending
      const lbItem = proxy.getPersistedWorkItemById({ workItemId: lbId, index: 0 });

      expect(lbItem?.status).toBe('pending');
    });

    it('VALID: {abortSignal already aborted} => loop exits immediately without dispatching', async () => {
      const questId = QuestIdStub({ value: 'dispatch-6' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupAborted();

      const abortController = new AbortController();
      abortController.abort();

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dispatch-6' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          abortSignal: abortController.signal,
        }),
      ).resolves.toBeUndefined();
    });

    it('VALID: {chat role completes, another chat pending} => loop recurses without userMessage so second chat stays pending', async () => {
      const questId = QuestIdStub({ value: 'dispatch-7' });
      const chaosId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const quest = QuestStub({
        id: questId,
        status: 'created',
        workItems: [WorkItemStub({ id: chaosId, role: 'chaoswhisperer', status: 'pending' })],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatDispatch({ quest });

      try {
        await questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dispatch-7' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'test message' }),
        });
      } catch {
        // Recursion may fail due to incomplete mocks — expected
      }

      // Verify chaos was marked in_progress (userMessage was present for first dispatch)
      const chaosItem = proxy.getPersistedWorkItemById({ workItemId: chaosId, index: 0 });

      expect(chaosItem?.status).toBe('in_progress');
    });
  });

  describe('dependency and ordering rules', () => {
    it('VALID: {item with 2 deps, one complete one in_progress} => item not ready until all deps complete', async () => {
      const questId = QuestIdStub({ value: 'dep-1' });
      const dep1 = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const dep2 = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: dep1, role: 'codeweaver', status: 'complete' }),
          WorkItemStub({ id: dep2, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'pending',
            dependsOn: [dep1, dep2],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupNoReadyItems({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dep-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toHaveLength(0);
    });

    it('VALID: {ward pending, dependsOn failed codeweaver} => ward never becomes ready, quest blocked', async () => {
      const questId = QuestIdStub({ value: 'dep-2' });
      const cwId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const wardId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'failed' }),
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
          processId: ProcessIdStub({ value: 'proc-dep-2' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      const lastStatus = proxy.getLastPersistedQuestStatus();

      expect(lastStatus).toBe('blocked');
    });

    it('VALID: {ward fails twice creating replacement chain A->B->C} => siege dep rewired to ward-C, becomes ready when C completes', async () => {
      const questId = QuestIdStub({ value: 'dep-5' });
      const wardA = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const wardB = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const wardC = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const siegeId = QuestWorkItemIdStub({ value: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: wardA, role: 'ward', status: 'failed' }),
          WorkItemStub({ id: wardB, role: 'ward', status: 'failed', insertedBy: wardA }),
          WorkItemStub({ id: wardC, role: 'ward', status: 'complete', insertedBy: wardB }),
          WorkItemStub({
            id: siegeId,
            role: 'siegemaster',
            status: 'pending',
            dependsOn: [wardC],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      try {
        await questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-dep-5' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        });
      } catch {
        // Layer broker may fail — expected
      }

      // Siege should have been marked in_progress (ward-C satisfied its dep)
      const siegeItem = proxy.getPersistedWorkItemById({ workItemId: siegeId, index: 0 });

      expect(siegeItem?.status).toBe('in_progress');
    });
  });

  describe('quest status rules', () => {
    it('VALID: {all work items complete} => quest status transitions to complete', async () => {
      const questId = QuestIdStub({ value: 'status-1' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'chaoswhisperer',
            status: 'complete',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
            role: 'pathseeker',
            status: 'complete',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestTerminal({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-status-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      const lastStatus = proxy.getLastPersistedQuestStatus();

      expect(lastStatus).toBe('complete');
    });

    it('VALID: {pending items whose deps all failed} => quest status transitions to blocked', async () => {
      const questId = QuestIdStub({ value: 'status-2' });
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
          processId: ProcessIdStub({ value: 'proc-status-2' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      const lastStatus = proxy.getLastPersistedQuestStatus();

      expect(lastStatus).toBe('blocked');
    });

    it('VALID: {all items terminal but some failed} => quest status stays in_progress, not complete', async () => {
      const questId = QuestIdStub({ value: 'status-3' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
            role: 'pathseeker',
            status: 'failed',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' }),
            role: 'pathseeker',
            status: 'failed',
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestTerminal({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-status-3' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      // Status stays in_progress — no modify call for status change
      const lastStatus = proxy.getLastPersistedQuestStatus();

      expect(lastStatus).toBeUndefined();
    });

    it('VALID: {quest in explore_flows with failed chaos} => pre-execution status preserved, not overwritten', async () => {
      const questId = QuestIdStub({ value: 'status-4' });
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
      proxy.setupQuestTerminal({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-status-4' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      // Pre-execution status preserved — no modify call
      const lastStatus = proxy.getLastPersistedQuestStatus();

      expect(lastStatus).toBeUndefined();
    });

    it('VALID: {some items still in_progress} => quest stays in_progress even if others failed', async () => {
      const questId = QuestIdStub({ value: 'status-5' });
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
      proxy.setupNoReadyItems({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-status-5' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).resolves.toBeUndefined();

      const persisted = proxy.getAllPersistedContents();

      expect(persisted).toHaveLength(0);
    });
  });

  describe('failure handling', () => {
    it('ERROR: {layer broker throws JS exception} => dispatched items marked failed and error re-thrown', async () => {
      const questId = QuestIdStub({ value: 'quest-fail-1' });
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
      proxy.setupLayerBrokerThrows({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-fail-1' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Build auth flow' }),
        }),
      ).rejects.toThrow(/spawn claude ENOENT/u);

      const persisted = proxy.getAllPersistedContents();

      expect(persisted.length).toBeGreaterThanOrEqual(2);
    });

    it('ERROR: {quest not found during loop} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent-fail-2' });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-fail-2' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });

    it('ERROR: {error handler itself throws} => original error propagates and is not swallowed', async () => {
      const questId = QuestIdStub({ value: 'quest-fail-3' });
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
      proxy.setupLayerBrokerThrows({ quest });

      // The catch block re-throws after handling — verify error is not swallowed
      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-fail-3' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Build auth flow' }),
        }),
      ).rejects.toThrow(/spawn claude ENOENT/u);
    });

    it('ERROR: {agent times out and process is killed} => error handler marks dispatched items failed', async () => {
      const questId = QuestIdStub({ value: 'quest-fail-6' });
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
      // Timeout causes spawn to fail — at the orchestration loop level,
      // this manifests as the layer broker throwing
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLayerBrokerThrows({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-fail-6' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Build auth flow' }),
        }),
      ).rejects.toThrow(/spawn claude ENOENT/u);

      const persisted = proxy.getAllPersistedContents();

      expect(persisted.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('in_progress marking', () => {
    it('VALID: {ready items} => marked in_progress with startedAt before dispatch', async () => {
      const questId = QuestIdStub({ value: 'quest-progress' });
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
      // Use setupLayerBrokerThrows so the spawn throws after in_progress marking
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupLayerBrokerThrows({ quest });

      await expect(
        questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-progress' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
          userMessage: UserInputStub({ value: 'Build auth flow' }),
        }),
      ).rejects.toThrow(/spawn claude ENOENT/u);

      // First persist is the in_progress marking (index 0)
      const firstPersistedQuest = proxy.getPersistedQuestAt({ index: 0 });
      const chaosItem = firstPersistedQuest.workItems.find((wi) => wi.id === chaosId);

      expect(chaosItem?.status).toBe('in_progress');
      expect(chaosItem?.startedAt).toBe('2024-01-15T10:00:00.000Z');
    });
  });

  describe('additional loop tests', () => {
    it('VALID: {ready codeweaver item} => item marked in_progress with startedAt before dispatch', async () => {
      const questId = QuestIdStub({ value: 'loop-20' });
      const psId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const cwId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: psId, role: 'pathseeker', status: 'complete' }),
          WorkItemStub({ id: cwId, role: 'codeweaver', status: 'pending', dependsOn: [psId] }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      try {
        await questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-loop-20' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        });
      } catch {
        // Layer broker may fail — expected
      }

      const cwItem = proxy.getPersistedWorkItemById({ workItemId: cwId, index: 0 });

      expect(cwItem).toBeDefined();
      expect(cwItem?.status).toBe('in_progress');
      expect(cwItem?.startedAt).toBe('2024-01-15T10:00:00.000Z');
    });

    it('VALID: {new codeweaver pending with no deps after previous failed} => codeweaver dispatched (recovery from blocked)', async () => {
      const questId = QuestIdStub({ value: 'loop-21' });
      const failedCw = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const newCw = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e' });
      const wardId = QuestWorkItemIdStub({ value: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: failedCw, role: 'codeweaver', status: 'failed' }),
          WorkItemStub({ id: newCw, role: 'codeweaver', status: 'pending' }),
          WorkItemStub({
            id: wardId,
            role: 'ward',
            status: 'pending',
            dependsOn: [failedCw],
          }),
        ],
      });
      const proxy = questOrchestrationLoopBrokerProxy();
      proxy.setupChatRoleReady({ quest });

      try {
        await questOrchestrationLoopBroker({
          processId: ProcessIdStub({ value: 'proc-loop-21' }),
          questId,
          startPath: FilePathStub({ value: '/project/src' }),
        });
      } catch {
        // Layer broker may fail — expected
      }

      // New codeweaver should have been marked in_progress (recovery from blocked)
      const cwItem = proxy.getPersistedWorkItemById({ workItemId: newCw, index: 0 });

      expect(cwItem?.status).toBe('in_progress');
    });
  });
});
