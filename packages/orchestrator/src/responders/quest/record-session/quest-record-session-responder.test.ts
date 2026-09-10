import {
  AbsoluteFilePathStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemRoleStub,
} from '@dungeonmaster/shared/contracts';

import { QuestRecordSessionResponder } from './quest-record-session-responder';
import { QuestRecordSessionResponderProxy } from './quest-record-session-responder.proxy';

describe('QuestRecordSessionResponder', () => {
  it('VALID: {questId, sessionId, cwd, role} => appends a row carrying that cwd', async () => {
    const proxy = QuestRecordSessionResponderProxy();
    const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', sessions: [] });
    proxy.setupQuestFound({ quest });

    const result = await QuestRecordSessionResponder({
      questId: QuestIdStub({ value: quest.id }),
      sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
      cwd: AbsoluteFilePathStub({ value: '/repo' }),
      role: WorkItemRoleStub({ value: 'codeweaver' }),
    });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getLastPersistedQuest().sessions).toStrictEqual([
      {
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: '/repo',
        role: 'codeweaver',
        startedAt: '2024-01-15T10:00:00.000Z',
      },
    ]);
  });

  it('VALID: {workItemId supplied} => the appended row carries it', async () => {
    const proxy = QuestRecordSessionResponderProxy();
    const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', sessions: [] });
    proxy.setupQuestFound({ quest });

    await QuestRecordSessionResponder({
      questId: QuestIdStub({ value: quest.id }),
      sessionId: SessionIdStub({ value: '8e4e1efe-5619-4d0a-8604-5e92d01423b7' }),
      cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth' }),
      role: WorkItemRoleStub({ value: 'flowrider' }),
      workItemId: QuestWorkItemIdStub({ value: '4ded720b-72f0-4357-a64d-98faec4157df' }),
    });

    expect(proxy.getLastPersistedQuest().sessions).toStrictEqual([
      {
        sessionId: '8e4e1efe-5619-4d0a-8604-5e92d01423b7',
        cwd: '/repo/worktrees/add-auth',
        role: 'flowrider',
        workItemId: '4ded720b-72f0-4357-a64d-98faec4157df',
        startedAt: '2024-01-15T10:00:00.000Z',
      },
    ]);
  });
});
