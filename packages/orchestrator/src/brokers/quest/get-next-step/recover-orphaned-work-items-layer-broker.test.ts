import {
  AgentIdStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { recoverOrphanedWorkItemsLayerBroker } from './recover-orphaned-work-items-layer-broker';
import { recoverOrphanedWorkItemsLayerBrokerProxy } from './recover-orphaned-work-items-layer-broker.proxy';

describe('recoverOrphanedWorkItemsLayerBroker', () => {
  describe('nothing to recover', () => {
    it('EMPTY: {quest with only pending and complete items} => returns quest unchanged and persists nothing', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-no-orphans' }),
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'aaa00000-1111-4222-9333-444444444444' }),
            role: 'codeweaver',
            status: 'complete',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'bbb00000-1111-4222-9333-444444444444' }),
            role: 'ward',
            status: 'pending',
            spawnerType: 'command',
          }),
        ],
      });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect(result).toStrictEqual(quest);
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
      expect(proxy.getBlockCalls()).toStrictEqual([]);
    });

    it('VALID: {terminal work item whose linked operation is already complete} => returns quest unchanged and persists nothing', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const operationId = OperationItemIdStub({ value: 'aaaa1111-58cc-4372-a567-0e02b2c3d479' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-applied-signal' }),
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: operationId, role: 'codeweaver', status: 'complete' }),
        ],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'ccc00000-1111-4222-9333-444444444444' }),
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${operationId}` as never],
          }),
        ],
      });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect(result).toStrictEqual(quest);
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });

    it('VALID: {terminal work item with no operations ref} => returns quest unchanged and persists nothing', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-no-op-ref' }),
        status: 'in_progress',
        operations: [OperationItemStub({ status: 'in_progress' })],
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: 'ddd00000-1111-4222-9333-444444444444' }),
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [],
          }),
        ],
      });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect(result).toStrictEqual(quest);
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('orphaned in_progress recovery', () => {
    it('VALID: {one in_progress orphan without sessionId, under budget} => returns quest with that item flipped to pending WITHOUT resume marker', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const orphanId = QuestWorkItemIdStub({ value: 'ccc11111-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-one-orphan' }),
        status: 'in_progress',
        workItems: [WorkItemStub({ id: orphanId, role: 'pesteater', status: 'in_progress' })],
      });
      proxy.setupModifyForQuest({ quest });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect(result.workItems).toStrictEqual([
        WorkItemStub({ id: orphanId, role: 'pesteater', status: 'pending' }),
      ]);
    });

    it('VALID: {orphan without sessionId} => persists it as pending with retryCount bumped and no resume marker', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const orphanId = QuestWorkItemIdStub({ value: 'ccc22222-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-orphan-fresh' }),
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: orphanId, role: 'pesteater', status: 'in_progress', retryCount: 0 }),
        ],
      });
      proxy.setupModifyForQuest({ quest });

      await recoverOrphanedWorkItemsLayerBroker({ quest });

      const persisted = proxy.getLastPersistedQuest();
      const persistedItem = persisted.workItems.find((item) => item.id === orphanId);

      expect({
        status: persistedItem?.status,
        retryCount: persistedItem?.retryCount,
        resume: persistedItem?.resume,
      }).toStrictEqual({
        status: 'pending',
        retryCount: 1,
        resume: undefined,
      });
    });

    it('VALID: {orphan carrying sessionId, agentId, startedAt} => persists it as pending KEEPING identity, gaining resume: true and retryCount + 1', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const orphanId = QuestWorkItemIdStub({ value: 'ddd22222-1111-4222-9333-444444444444' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const agentId = AgentIdStub({ value: 'agent-dead' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-orphan-identity' }),
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: orphanId,
            role: 'pesteater',
            status: 'in_progress',
            retryCount: 0,
            sessionId,
            agentId,
            startedAt: '2026-06-12T10:00:00.000Z',
          }),
        ],
      });
      proxy.setupModifyForQuest({ quest });

      await recoverOrphanedWorkItemsLayerBroker({ quest });

      const persisted = proxy.getLastPersistedQuest();
      const persistedItem = persisted.workItems.find((item) => item.id === orphanId);

      expect({
        status: persistedItem?.status,
        retryCount: persistedItem?.retryCount,
        sessionId: persistedItem?.sessionId,
        agentId: persistedItem?.agentId,
        startedAt: persistedItem?.startedAt,
        resume: persistedItem?.resume,
      }).toStrictEqual({
        status: 'pending',
        retryCount: 1,
        sessionId,
        agentId,
        startedAt: '2026-06-12T10:00:00.000Z',
        resume: true,
      });
    });

    it('VALID: {orphan carrying sessionId} => returned quest has the item pending with resume: true and sessionId kept', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const orphanId = QuestWorkItemIdStub({ value: 'ddd33333-1111-4222-9333-444444444444' });
      const sessionId = SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-orphan-local-resume' }),
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: orphanId, role: 'codeweaver', status: 'in_progress', sessionId }),
        ],
      });
      proxy.setupModifyForQuest({ quest });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect(result.workItems).toStrictEqual([
        WorkItemStub({
          id: orphanId,
          role: 'codeweaver',
          status: 'pending',
          sessionId,
          resume: true,
        }),
      ]);
    });

    it('VALID: {quest with two in_progress orphans under budget} => returns both flipped to pending', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const firstId = QuestWorkItemIdStub({ value: 'eee33333-1111-4222-9333-444444444444' });
      const secondId = QuestWorkItemIdStub({ value: 'fff44444-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-two-orphans' }),
        status: 'in_progress',
        workItems: [
          WorkItemStub({ id: firstId, role: 'codeweaver', status: 'in_progress' }),
          WorkItemStub({
            id: secondId,
            role: 'lawbringer',
            status: 'in_progress',
            dependsOn: [firstId],
          }),
        ],
      });
      proxy.setupModifyForQuest({ quest });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect(result.workItems).toStrictEqual([
        WorkItemStub({ id: firstId, role: 'codeweaver', status: 'pending' }),
        WorkItemStub({ id: secondId, role: 'lawbringer', status: 'pending', dependsOn: [firstId] }),
      ]);
    });
  });

  describe('reconcile net (terminal item, operation still in_progress)', () => {
    it('VALID: {complete work item linked to an in_progress operation, sessionId kept} => flips it back to pending with resume: true', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const operationId = OperationItemIdStub({ value: 'bbbb2222-58cc-4372-a567-0e02b2c3d479' });
      const itemId = QuestWorkItemIdStub({ value: 'abc12345-1111-4222-9333-444444444444' });
      const sessionId = SessionIdStub({ value: '1c4d8f1c-3e38-48c9-bdec-22b61883b473' });
      const quest = QuestStub({
        id: QuestIdStub({ value: 'q-unapplied-signal' }),
        status: 'in_progress',
        operations: [
          OperationItemStub({ id: operationId, role: 'codeweaver', status: 'in_progress' }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            sessionId,
            relatedDataItems: [`operations/${operationId}` as never],
          }),
        ],
      });
      proxy.setupModifyForQuest({ quest });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      const persisted = proxy.getLastPersistedQuest();
      const persistedItem = persisted.workItems.find((item) => item.id === itemId);

      expect({
        localWorkItems: result.workItems,
        persistedStatus: persistedItem?.status,
        persistedResume: persistedItem?.resume,
        persistedRetryCount: persistedItem?.retryCount,
        persistedSessionId: persistedItem?.sessionId,
      }).toStrictEqual({
        localWorkItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'pending',
            sessionId,
            resume: true,
            relatedDataItems: [`operations/${operationId}` as never],
          }),
        ],
        persistedStatus: 'pending',
        persistedResume: true,
        persistedRetryCount: 1,
        persistedSessionId: sessionId,
      });
    });
  });

  describe('escalation (retry budget exhausted)', () => {
    it('VALID: {orphan whose retryCount reached maxResets} => escalates via questBlockOnFailureBroker (no reset persist), item reads failed locally', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'q-orphan-exhausted' });
      const orphanId = QuestWorkItemIdStub({ value: 'ababab00-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: orphanId,
            role: 'codeweaver',
            status: 'in_progress',
            retryCount: slotManagerStatics.orphanRecovery.maxResets,
          }),
        ],
      });
      proxy.setupEscalation({ quest });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect({
        localStatus: result.workItems.find((item) => item.id === orphanId)?.status,
        blockCalls: proxy.getBlockCalls(),
        resetPersistCount: proxy.getAllPersistedContents().length,
      }).toStrictEqual({
        localStatus: 'failed',
        blockCalls: [{ questId, failedWorkItemId: orphanId }],
        resetPersistCount: 0,
      });
    });

    it('VALID: {two orphans both at maxResets} => only the FIRST escalates, the second is reset to pending', async () => {
      const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
      const questId = QuestIdStub({ value: 'q-two-exhausted' });
      const firstId = QuestWorkItemIdStub({ value: 'cdcdcd00-1111-4222-9333-444444444444' });
      const secondId = QuestWorkItemIdStub({ value: 'efefef00-1111-4222-9333-444444444444' });
      const quest = QuestStub({
        id: questId,
        status: 'in_progress',
        workItems: [
          WorkItemStub({
            id: firstId,
            role: 'codeweaver',
            status: 'in_progress',
            retryCount: slotManagerStatics.orphanRecovery.maxResets,
          }),
          WorkItemStub({
            id: secondId,
            role: 'lawbringer',
            status: 'in_progress',
            retryCount: slotManagerStatics.orphanRecovery.maxResets,
          }),
        ],
      });
      proxy.setupEscalation({ quest });

      const result = await recoverOrphanedWorkItemsLayerBroker({ quest });

      expect({
        blockCalls: proxy.getBlockCalls(),
        localFirstStatus: result.workItems.find((item) => item.id === firstId)?.status,
        localSecondStatus: result.workItems.find((item) => item.id === secondId)?.status,
      }).toStrictEqual({
        blockCalls: [{ questId, failedWorkItemId: firstId }],
        localFirstStatus: 'failed',
        localSecondStatus: 'pending',
      });
    });
  });
});
