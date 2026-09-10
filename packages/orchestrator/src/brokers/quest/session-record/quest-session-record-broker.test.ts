import {
  AbsoluteFilePathStub,
  QuestIdStub,
  QuestSessionStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemRoleStub,
} from '@dungeonmaster/shared/contracts';

import { questSessionRecordBroker } from './quest-session-record-broker';
import { questSessionRecordBrokerProxy } from './quest-session-record-broker.proxy';

describe('questSessionRecordBroker', () => {
  describe('appending a row', () => {
    it('VALID: {quest has no rows} => appends one carrying the cwd it was handed', async () => {
      const proxy = questSessionRecordBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', sessions: [] });
      proxy.setupQuestFound({ quest });

      await questSessionRecordBroker({
        questId: QuestIdStub({ value: quest.id }),
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
        cwd: AbsoluteFilePathStub({ value: '/repo' }),
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
      });

      expect(proxy.getLastPersistedQuest().sessions).toStrictEqual([
        {
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'chaoswhisperer',
          startedAt: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });

    it('VALID: {workItemId supplied} => the row carries it', async () => {
      const proxy = questSessionRecordBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', sessions: [] });
      proxy.setupQuestFound({ quest });

      await questSessionRecordBroker({
        questId: QuestIdStub({ value: quest.id }),
        sessionId: SessionIdStub({ value: '8e4e1efe-5619-4d0a-8604-5e92d01423b7' }),
        cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' }),
        role: WorkItemRoleStub({ value: 'codeweaver' }),
        workItemId: QuestWorkItemIdStub({ value: '8acf84af-a24b-4d29-9e4e-4819d21a5480' }),
      });

      expect(proxy.getLastPersistedQuest().sessions).toStrictEqual([
        {
          sessionId: '8e4e1efe-5619-4d0a-8604-5e92d01423b7',
          cwd: '/repo/worktrees/add-auth',
          role: 'codeweaver',
          workItemId: '8acf84af-a24b-4d29-9e4e-4819d21a5480',
          startedAt: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });

    it('VALID: {quest already holds a DIFFERENT session} => appends beside it, keeping both cwds', async () => {
      const proxy = questSessionRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        worktreePath: '/repo/worktrees/add-auth',
        sessions: [
          QuestSessionStub({
            sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
            cwd: '/repo',
            role: 'chaoswhisperer',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await questSessionRecordBroker({
        questId: QuestIdStub({ value: quest.id }),
        sessionId: SessionIdStub({ value: '8e4e1efe-5619-4d0a-8604-5e92d01423b7' }),
        cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' }),
        role: WorkItemRoleStub({ value: 'codeweaver' }),
      });

      expect(proxy.getLastPersistedQuest().sessions).toStrictEqual([
        {
          sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
          cwd: '/repo',
          role: 'chaoswhisperer',
          startedAt: '2024-01-15T10:00:00.000Z',
        },
        {
          sessionId: '8e4e1efe-5619-4d0a-8604-5e92d01423b7',
          cwd: '/repo/worktrees/add-auth',
          role: 'codeweaver',
          startedAt: '2024-01-15T10:00:00.000Z',
        },
      ]);
    });
  });

  describe('written once, never rewritten', () => {
    it('VALID: {a row for that sessionId already exists} => persists nothing at all', async () => {
      const proxy = questSessionRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        sessions: [
          QuestSessionStub({
            sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
            cwd: '/repo',
            role: 'chaoswhisperer',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await questSessionRecordBroker({
        questId: QuestIdStub({ value: quest.id }),
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
        cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' }),
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
      });

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it('VALID: {existing row, re-served with a DIFFERENT cwd} => persists nothing, so the first cwd stands', async () => {
      const proxy = questSessionRecordBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        worktreePath: '/repo/worktrees/add-auth',
        sessions: [
          QuestSessionStub({
            sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
            cwd: '/repo',
            role: 'chaoswhisperer',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });

      await questSessionRecordBroker({
        questId: QuestIdStub({ value: quest.id }),
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
        cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' }),
        role: WorkItemRoleStub({ value: 'chaoswhisperer' }),
      });

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });
});
