import {
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questAdvanceBroker } from './quest-advance-broker';
import { questAdvanceBrokerProxy } from './quest-advance-broker.proxy';

describe('questAdvanceBroker', () => {
  describe('advancing to the first pending operation', () => {
    it('VALID: {pending codeweaver op, two prior complete items} => creates ONE agent work item chained after the most recent satisfying item, flips the op in_progress', async () => {
      const proxy = questAdvanceBrokerProxy();
      proxy.setupUuids({ ids: ['99999999-9999-4999-8999-999999999999'] });

      const doneOpA = OperationItemStub({
        id: '11111111-1111-4111-8111-111111111111',
        status: 'complete',
      });
      const doneOpB = OperationItemStub({
        id: '22222222-2222-4222-8222-222222222222',
        status: 'complete',
      });
      const pendingOp = OperationItemStub({
        id: '33333333-3333-4333-8333-333333333333',
        status: 'pending',
      });

      const olderId = QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const olderItem = WorkItemStub({
        id: olderId,
        status: 'complete',
        relatedDataItems: ['operations/11111111-1111-4111-8111-111111111111'],
        completedAt: '2024-01-14T10:00:00.000Z',
      });
      const newerId = QuestWorkItemIdStub({ value: 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e' });
      const newerItem = WorkItemStub({
        id: newerId,
        status: 'complete',
        relatedDataItems: ['operations/22222222-2222-4222-8222-222222222222'],
        completedAt: '2024-01-14T12:00:00.000Z',
      });

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [doneOpA, doneOpB, pendingOp],
        workItems: [olderItem, newerItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await questAdvanceBroker({ questId: QuestIdStub({ value: 'add-auth' }) });

      expect(result).toStrictEqual({ success: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [
            doneOpA,
            doneOpB,
            OperationItemStub({
              id: '33333333-3333-4333-8333-333333333333',
              status: 'in_progress',
            }),
          ],
          workItems: [
            olderItem,
            newerItem,
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: '99999999-9999-4999-8999-999999999999' }),
              role: 'codeweaver',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: ['operations/33333333-3333-4333-8333-333333333333'],
              dependsOn: [newerId],
              createdAt: '2024-01-15T10:00:00.000Z',
            }),
          ],
          updatedAt: '2024-01-15T10:00:00.000Z',
        }),
      );
    });

    it('VALID: {pending ward op with wardMode changed, empty workItems} => command work item with wardMode copied and dependsOn []', async () => {
      const proxy = questAdvanceBrokerProxy();
      proxy.setupUuids({ ids: ['99999999-9999-4999-8999-999999999999'] });

      const wardOp = OperationItemStub({
        id: '11111111-1111-4111-8111-111111111111',
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        wardMode: 'changed',
      });

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [wardOp],
        workItems: [],
      });
      proxy.setupQuestFound({ quest });

      const result = await questAdvanceBroker({ questId: QuestIdStub({ value: 'add-auth' }) });

      expect(result).toStrictEqual({ success: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: '11111111-1111-4111-8111-111111111111',
              role: 'ward',
              text: 'Ward gate (changed files)',
              status: 'in_progress',
              wardMode: 'changed',
            }),
          ],
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: '99999999-9999-4999-8999-999999999999' }),
              role: 'ward',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: ['operations/11111111-1111-4111-8111-111111111111'],
              dependsOn: [],
              wardMode: 'changed',
              createdAt: '2024-01-15T10:00:00.000Z',
            }),
          ],
          updatedAt: '2024-01-15T10:00:00.000Z',
        }),
      );
    });
  });

  describe('strict 1:1 operation-item↔work-item invariant', () => {
    it('VALID: {pending op already linked to a work item} => no new work item, persists nothing', async () => {
      const proxy = questAdvanceBrokerProxy();

      const pendingOp = OperationItemStub({
        id: '11111111-1111-4111-8111-111111111111',
        status: 'pending',
      });
      const linkedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'in_progress',
        relatedDataItems: ['operations/11111111-1111-4111-8111-111111111111'],
      });

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [pendingOp],
        workItems: [linkedItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await questAdvanceBroker({ questId: QuestIdStub({ value: 'add-auth' }) });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('no pending operations', () => {
    it('VALID: {every operation complete} => no-op, persists nothing', async () => {
      const proxy = questAdvanceBrokerProxy();

      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [
          OperationItemStub({
            id: '11111111-1111-4111-8111-111111111111',
            status: 'complete',
          }),
          OperationItemStub({
            id: '22222222-2222-4222-8222-222222222222',
            status: 'complete',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      const result = await questAdvanceBroker({ questId: QuestIdStub({ value: 'add-auth' }) });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('redelivery idempotency', () => {
    it('VALID: {called twice} => second call no-ops because the operation is now in_progress', async () => {
      const proxy = questAdvanceBrokerProxy();
      proxy.setupUuids({ ids: ['99999999-9999-4999-8999-999999999999'] });

      const pendingOp = OperationItemStub({
        id: '11111111-1111-4111-8111-111111111111',
        status: 'pending',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [pendingOp],
        workItems: [],
      });
      proxy.setupQuestFound({ quest });

      await questAdvanceBroker({ questId: QuestIdStub({ value: 'add-auth' }) });

      const afterFirst = proxy.getLastPersistedQuest();

      expect(afterFirst.operations.map(({ status }) => status)).toStrictEqual(['in_progress']);
      expect(afterFirst.workItems.map(({ id }) => id)).toStrictEqual([
        QuestWorkItemIdStub({ value: '99999999-9999-4999-8999-999999999999' }),
      ]);

      // Disk now holds the state the first call produced — re-feed it as the second read.
      proxy.setupQuestFound({ quest: afterFirst });

      const persistsBeforeSecondCall = proxy.getAllPersistedContents();

      const secondResult = await questAdvanceBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
      });

      expect(secondResult).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedContents()).toStrictEqual(persistsBeforeSecondCall);
    });
  });
});
