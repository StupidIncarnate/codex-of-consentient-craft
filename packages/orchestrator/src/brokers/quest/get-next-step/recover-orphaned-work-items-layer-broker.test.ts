import {
  AgentIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

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

  it('VALID: {quest with one in_progress orphan} => returns quest with that item flipped to pending', async () => {
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

  it('VALID: {orphan carrying sessionId, agentId, startedAt} => persists it as pending with per-run identity cleared', async () => {
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

    expect(persistedItem?.status).toBe('pending');
    expect(persistedItem?.sessionId).toBe(undefined);
    expect(persistedItem?.agentId).toBe(undefined);
    expect(persistedItem?.startedAt).toBe(undefined);
  });

  it('VALID: {quest with two in_progress orphans} => returns both flipped to pending', async () => {
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
