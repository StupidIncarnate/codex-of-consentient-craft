import {
  AbsoluteFilePathStub,
  QuestIdStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemRoleStub,
} from '@dungeonmaster/shared/contracts';

import { orchestratorRecordQuestSessionAdapter } from './orchestrator-record-quest-session-adapter';
import { orchestratorRecordQuestSessionAdapterProxy } from './orchestrator-record-quest-session-adapter.proxy';

describe('orchestratorRecordQuestSessionAdapter', () => {
  describe('successful record', () => {
    it('VALID: {questId, sessionId, cwd, role} => forwards every field to the broker', async () => {
      const proxy = orchestratorRecordQuestSessionAdapterProxy();
      proxy.returns({ sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999' });

      const result = await orchestratorRecordQuestSessionAdapter({
        questId: QuestIdStub({ value: 'add-auth' }),
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
        cwd: AbsoluteFilePathStub({ value: '/repo' }),
        role: WorkItemRoleStub({ value: 'codeweaver' }),
      });

      expect(result).toStrictEqual({ success: true });
      expect(
        proxy.getLastCallFor({ sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
      ).toStrictEqual({
        questId: 'add-auth',
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: '/repo',
        role: 'codeweaver',
      });
    });

    it('VALID: {workItemId supplied} => forwards it too', async () => {
      const proxy = orchestratorRecordQuestSessionAdapterProxy();
      proxy.returns({ sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999' });

      await orchestratorRecordQuestSessionAdapter({
        questId: QuestIdStub({ value: 'add-auth' }),
        sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
        cwd: AbsoluteFilePathStub({ value: '/repo' }),
        role: WorkItemRoleStub({ value: 'codeweaver' }),
        workItemId: QuestWorkItemIdStub({ value: '8acf84af-a24b-4d29-9e4e-4819d21a5480' }),
      });

      expect(
        proxy.getLastCallFor({ sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
      ).toStrictEqual({
        questId: 'add-auth',
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        cwd: '/repo',
        role: 'codeweaver',
        workItemId: '8acf84af-a24b-4d29-9e4e-4819d21a5480',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {orchestrator throws} => propagates the error', async () => {
      const proxy = orchestratorRecordQuestSessionAdapterProxy();
      proxy.throws({
        sessionId: 'e0047cb8-02a2-448f-a1cb-909c9681f999',
        error: new Error('Quest not found'),
      });

      await expect(
        orchestratorRecordQuestSessionAdapter({
          questId: QuestIdStub({ value: 'ghost-quest' }),
          sessionId: SessionIdStub({ value: 'e0047cb8-02a2-448f-a1cb-909c9681f999' }),
          cwd: AbsoluteFilePathStub({ value: '/repo' }),
          role: WorkItemRoleStub({ value: 'codeweaver' }),
        }),
      ).rejects.toThrow(/Quest not found/u);
    });
  });
});
