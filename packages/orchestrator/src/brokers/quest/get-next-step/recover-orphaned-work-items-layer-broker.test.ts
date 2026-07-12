import {
  AgentIdStub,
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
  });

  it('VALID: {quest with one in_progress orphan under budget} => returns quest with that item flipped to pending', async () => {
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

  it('VALID: {orphan carrying sessionId, agentId, startedAt} => persists it as pending with retryCount bumped and per-run identity cleared', async () => {
    const proxy = recoverOrphanedWorkItemsLayerBrokerProxy();
    const orphanId = QuestWorkItemIdStub({ value: 'ddd22222-1111-4222-9333-444444444444' });
    const quest = QuestStub({
      id: QuestIdStub({ value: 'q-orphan-identity' }),
      status: 'in_progress',
      workItems: [
        WorkItemStub({
          id: orphanId,
          role: 'pesteater',
          status: 'in_progress',
          retryCount: 0,
          sessionId: SessionIdStub({ value: '9c4d8f1c-3e38-48c9-bdec-22b61883b473' }),
          agentId: AgentIdStub({ value: 'agent-dead' }),
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
    }).toStrictEqual({
      status: 'pending',
      retryCount: 1,
      sessionId: undefined,
      agentId: undefined,
      startedAt: undefined,
    });
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

  it('VALID: {orphan whose retryCount reached maxResets} => escalates to a PathSeeker replan (no more resets), item reads failed locally', async () => {
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
      replanCalls: proxy.getReplanCalls(),
      resetPersistCount: proxy.getAllPersistedContents().length,
    }).toStrictEqual({
      localStatus: 'failed',
      replanCalls: [[{ questId, failedWorkItemId: orphanId }]],
      resetPersistCount: 0,
    });
  });
});
