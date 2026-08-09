import {
  AbsoluteFilePathStub,
  BaseBranchNameStub,
  OperationItemStub,
  QuestBranchNameStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questOperationsUpdateBroker } from './quest-operations-update-broker';
import { questOperationsUpdateBrokerProxy } from './quest-operations-update-broker.proxy';

describe('questOperationsUpdateBroker', () => {
  describe('no-op update', () => {
    it('VALID: {update returns null} => returns null, persists nothing, callback saw the loaded quest', async () => {
      const proxy = questOperationsUpdateBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [OperationItemStub({ status: 'pending' })],
      });
      proxy.setupQuestFound({ quest });

      const seenQuests: ReturnType<typeof QuestStub>[] = [];

      const result = await questOperationsUpdateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        update: ({ quest: loaded }) => {
          seenQuests.push(loaded);
          return null;
        },
      });

      expect(result).toBe(null);
      expect(seenQuests).toStrictEqual([quest]);
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('operations replacement', () => {
    it('VALID: {update returns {operations}} => persists replaced ledger with derived status + updatedAt', async () => {
      const proxy = questOperationsUpdateBrokerProxy();
      const pendingOp = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        status: 'pending',
      });
      const activeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [pendingOp],
        workItems: [activeItem],
      });
      proxy.setupQuestFound({ quest });

      const result = await questOperationsUpdateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        update: () => ({
          operations: [
            OperationItemStub({
              id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
              status: 'in_progress',
            }),
          ],
        }),
      });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [
            OperationItemStub({
              id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
              status: 'in_progress',
            }),
          ],
          workItems: [activeItem],
          updatedAt: '2024-01-15T10:00:00.000Z',
        }),
      );
      expect(result).toStrictEqual({ quest: persisted });
    });
  });

  describe('workItems replacement', () => {
    it('VALID: {update returns {workItems} only, ledger still pending} => operations untouched, status stays in_progress (no false complete)', async () => {
      const proxy = questOperationsUpdateBrokerProxy();
      const pendingOp = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        status: 'pending',
      });
      const activeItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'in_progress',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [pendingOp],
        workItems: [activeItem],
      });
      proxy.setupQuestFound({ quest });

      const completedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });

      await questOperationsUpdateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        update: () => ({ workItems: [completedItem] }),
      });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
          workItems: [completedItem],
          updatedAt: '2024-01-15T10:00:00.000Z',
        }),
      );
    });
  });

  describe('terminal-operation complete derivation', () => {
    it('VALID: {last operation completes, all work items terminal} => persisted status derives to complete', async () => {
      const proxy = questOperationsUpdateBrokerProxy();
      const runningOp = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        status: 'in_progress',
      });
      const terminalItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        status: 'complete',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [runningOp],
        workItems: [terminalItem],
      });
      proxy.setupQuestFound({ quest });

      await questOperationsUpdateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        update: () => ({
          operations: [
            OperationItemStub({
              id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
              status: 'complete',
            }),
          ],
        }),
      });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'complete',
          operations: [
            OperationItemStub({
              id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
              status: 'complete',
            }),
          ],
          workItems: [terminalItem],
          updatedAt: '2024-01-15T10:00:00.000Z',
        }),
      );
    });
  });

  describe('git context fields', () => {
    describe('branchName', () => {
      it('VALID: {update returns {branchName}} => persists branchName', async () => {
        const proxy = questOperationsUpdateBrokerProxy();
        const pendingOp = OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          status: 'pending',
        });
        const quest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
        });
        proxy.setupQuestFound({ quest });

        const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });

        await questOperationsUpdateBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          update: () => ({ branchName }),
        });

        const persisted = proxy.getLastPersistedQuest();

        expect(persisted).toStrictEqual(
          QuestStub({
            id: 'add-auth',
            folder: '001-add-auth',
            status: 'in_progress',
            operations: [pendingOp],
            branchName,
            updatedAt: '2024-01-15T10:00:00.000Z',
          }),
        );
      });

      it('VALID: {update omits branchName, quest already has one} => preserves existing branchName', async () => {
        const proxy = questOperationsUpdateBrokerProxy();
        const pendingOp = OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          status: 'pending',
        });
        const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
        const quest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
          branchName,
        });
        proxy.setupQuestFound({ quest });

        await questOperationsUpdateBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          update: () => ({
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'in_progress',
              }),
            ],
          }),
        });

        const persisted = proxy.getLastPersistedQuest();

        expect(persisted).toStrictEqual(
          QuestStub({
            id: 'add-auth',
            folder: '001-add-auth',
            status: 'in_progress',
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'in_progress',
              }),
            ],
            branchName,
            updatedAt: '2024-01-15T10:00:00.000Z',
          }),
        );
      });
    });

    describe('baseBranch', () => {
      it('VALID: {update returns {baseBranch}} => persists baseBranch', async () => {
        const proxy = questOperationsUpdateBrokerProxy();
        const pendingOp = OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          status: 'pending',
        });
        const quest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
        });
        proxy.setupQuestFound({ quest });

        const baseBranch = BaseBranchNameStub({ value: 'main' });

        await questOperationsUpdateBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          update: () => ({ baseBranch }),
        });

        const persisted = proxy.getLastPersistedQuest();

        expect(persisted).toStrictEqual(
          QuestStub({
            id: 'add-auth',
            folder: '001-add-auth',
            status: 'in_progress',
            operations: [pendingOp],
            baseBranch,
            updatedAt: '2024-01-15T10:00:00.000Z',
          }),
        );
      });

      it('VALID: {update omits baseBranch, quest already has one} => preserves existing baseBranch', async () => {
        const proxy = questOperationsUpdateBrokerProxy();
        const pendingOp = OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          status: 'pending',
        });
        const baseBranch = BaseBranchNameStub({ value: 'master' });
        const quest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
          baseBranch,
        });
        proxy.setupQuestFound({ quest });

        await questOperationsUpdateBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          update: () => ({
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'in_progress',
              }),
            ],
          }),
        });

        const persisted = proxy.getLastPersistedQuest();

        expect(persisted).toStrictEqual(
          QuestStub({
            id: 'add-auth',
            folder: '001-add-auth',
            status: 'in_progress',
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'in_progress',
              }),
            ],
            baseBranch,
            updatedAt: '2024-01-15T10:00:00.000Z',
          }),
        );
      });
    });

    describe('worktreePath', () => {
      it('VALID: {update returns {worktreePath}} => persists worktreePath', async () => {
        const proxy = questOperationsUpdateBrokerProxy();
        const pendingOp = OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          status: 'pending',
        });
        const quest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
        });
        proxy.setupQuestFound({ quest });

        const worktreePath = AbsoluteFilePathStub({
          value: '/home/testuser/.dungeonmaster/worktrees/add-auth-7bc217a1',
        });

        await questOperationsUpdateBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          update: () => ({ worktreePath }),
        });

        const persisted = proxy.getLastPersistedQuest();

        expect(persisted).toStrictEqual(
          QuestStub({
            id: 'add-auth',
            folder: '001-add-auth',
            status: 'in_progress',
            operations: [pendingOp],
            worktreePath,
            updatedAt: '2024-01-15T10:00:00.000Z',
          }),
        );
      });

      it('VALID: {update omits worktreePath, quest already has one} => preserves existing worktreePath', async () => {
        const proxy = questOperationsUpdateBrokerProxy();
        const pendingOp = OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          status: 'pending',
        });
        const worktreePath = AbsoluteFilePathStub({
          value: '/home/testuser/.dungeonmaster/worktrees/add-auth-7bc217a1',
        });
        const quest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
          worktreePath,
        });
        proxy.setupQuestFound({ quest });

        await questOperationsUpdateBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          update: () => ({
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'in_progress',
              }),
            ],
          }),
        });

        const persisted = proxy.getLastPersistedQuest();

        expect(persisted).toStrictEqual(
          QuestStub({
            id: 'add-auth',
            folder: '001-add-auth',
            status: 'in_progress',
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'in_progress',
              }),
            ],
            worktreePath,
            updatedAt: '2024-01-15T10:00:00.000Z',
          }),
        );
      });
    });

    describe('combined', () => {
      it('VALID: {update returns branchName, baseBranch, worktreePath, baseRef together} => persists all four git-context fields in one write', async () => {
        const proxy = questOperationsUpdateBrokerProxy();
        const pendingOp = OperationItemStub({
          id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
          status: 'pending',
        });
        const quest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
        });
        proxy.setupQuestFound({ quest });

        const branchName = QuestBranchNameStub({ value: 'quest/add-auth-7bc217a1' });
        const baseBranch = BaseBranchNameStub({ value: 'main' });
        const worktreePath = AbsoluteFilePathStub({
          value: '/home/testuser/.dungeonmaster/worktrees/add-auth-7bc217a1',
        });
        const baseRef = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2' as never;

        await questOperationsUpdateBroker({
          questId: QuestIdStub({ value: 'add-auth' }),
          update: () => ({ branchName, baseBranch, worktreePath, baseRef }),
        });

        const persisted = proxy.getLastPersistedQuest();
        const expectedQuest = QuestStub({
          id: 'add-auth',
          folder: '001-add-auth',
          status: 'in_progress',
          operations: [pendingOp],
          branchName,
          baseBranch,
          worktreePath,
          baseRef,
          updatedAt: '2024-01-15T10:00:00.000Z',
        });

        expect(persisted).toStrictEqual(expectedQuest);
        // Proves the four git-context fields landed in ONE persist, not a trailing write.
        expect(proxy.getAllPersistedQuests()).toStrictEqual([expectedQuest]);
      });
    });
  });

  describe('lock serialization', () => {
    it('VALID: {two concurrent calls on same questId} => applied sequentially (first persist lands before second update runs)', async () => {
      const proxy = questOperationsUpdateBrokerProxy();
      const opOne = OperationItemStub({
        id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        status: 'pending',
      });
      const opTwo = OperationItemStub({
        id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
        status: 'pending',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        operations: [opOne, opTwo],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });

      const events: ReturnType<typeof QuestIdStub>[] = [];
      let persistsSeenBySecondUpdate: readonly unknown[] = [];

      const first = questOperationsUpdateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        update: () => {
          events.push(QuestIdStub({ value: 'first-update' }));
          return {
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'complete',
              }),
              opTwo,
            ],
          };
        },
      });

      const second = questOperationsUpdateBroker({
        questId: QuestIdStub({ value: 'add-auth' }),
        update: () => {
          persistsSeenBySecondUpdate = proxy.getAllPersistedContents();
          events.push(QuestIdStub({ value: 'second-update' }));
          return {
            operations: [
              OperationItemStub({
                id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
                status: 'complete',
              }),
              OperationItemStub({
                id: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
                status: 'complete',
              }),
            ],
          };
        },
      });

      await Promise.all([first, second]);

      expect(events).toStrictEqual([
        QuestIdStub({ value: 'first-update' }),
        QuestIdStub({ value: 'second-update' }),
      ]);

      // The second update callback ran only AFTER the first call's persist was written.
      const [firstPersist] = proxy.getAllPersistedContents();

      expect(persistsSeenBySecondUpdate).toStrictEqual([firstPersist]);

      // Both writes landed, in order: first derives in_progress (opTwo pending), second
      // drains the ledger over empty work items and derives complete.
      expect(proxy.getAllPersistedQuests().map(({ status }) => status)).toStrictEqual([
        'in_progress',
        'complete',
      ]);
    });
  });
});
