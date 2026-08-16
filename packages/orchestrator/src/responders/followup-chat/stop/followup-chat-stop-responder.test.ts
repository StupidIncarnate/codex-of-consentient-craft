import {
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { FollowupChatStopResponderProxy } from './followup-chat-stop-responder.proxy';

describe('FollowupChatStopResponder', () => {
  describe('a tavernkeeper turn in flight', () => {
    it('VALID: {quest with a registered tavernkeeper process} => kills that process and reports stopped', async () => {
      const proxy = FollowupChatStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-followup-stop-1' });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-0000000000e1' }),
            role: 'tavernkeeper',
            status: 'in_progress',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      const kill = proxy.setupRunningProcessFor({
        quest,
        processId: ProcessIdStub({ value: 'proc-tavernkeeper-stop' }),
        questId,
        workItemIndex: 0,
      });

      const result = await proxy.callResponder({ questId });

      expect({ result, killCalls: kill.mock.calls }).toStrictEqual({
        result: { stopped: true },
        killCalls: [[]],
      });
    });

    // The whole reason this responder exists instead of the pause endpoint: a follow-up STOP must
    // reach the tavernkeeper's process and NOTHING else. Pause scoped by questId, so on a quest
    // whose relay was still registered it killed agents this button never claimed to touch.
    it('VALID: {a sibling work item holds the only registered process} => kills nothing and reports not stopped', async () => {
      const proxy = FollowupChatStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-followup-stop-2' });
      const quest = QuestStub({
        id: questId,
        status: 'blocked',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-0000000000e2' }),
            role: 'tavernkeeper',
            status: 'in_progress',
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-0000000000e3' }),
            role: 'codeweaver',
            status: 'in_progress',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      const siblingKill = proxy.setupRunningProcessFor({
        quest,
        processId: ProcessIdStub({ value: 'proc-codeweaver-running' }),
        questId,
        workItemIndex: 1,
      });

      const result = await proxy.callResponder({ questId });

      expect({ result, siblingKillCalls: siblingKill.mock.calls }).toStrictEqual({
        result: { stopped: false },
        siblingKillCalls: [],
      });
    });
  });

  describe('nothing to stop', () => {
    // A STOP pressed before the spawn registered, or after the turn already ended. Not an error:
    // the composer disarms optimistically and a thrown 500 here would surface as a chat error
    // entry for a button that did exactly what the reader asked.
    it('EMPTY: {tavernkeeper item exists but no process registered} => reports not stopped', async () => {
      const proxy = FollowupChatStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-followup-stop-3' });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-0000000000e4' }),
            role: 'tavernkeeper',
            status: 'complete',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupNoRunningProcess();

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ stopped: false });
    });

    it('EMPTY: {quest has no tavernkeeper work item} => reports not stopped', async () => {
      const proxy = FollowupChatStopResponderProxy();
      const questId = QuestIdStub({ value: 'quest-followup-stop-4' });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '00000000-0000-4000-8000-0000000000e5' }),
            role: 'codeweaver',
            status: 'complete',
          }),
        ],
      });
      proxy.setupQuestFound({ quest });
      proxy.setupNoRunningProcess();

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ stopped: false });
    });
  });

  describe('missing quest', () => {
    it('ERROR: {questId resolves to no quest} => throws naming the quest', async () => {
      const proxy = FollowupChatStopResponderProxy();
      proxy.setupQuestNotFound();

      const error = await proxy
        .callResponder({ questId: QuestIdStub({ value: 'nonexistent-quest' }) })
        .catch((thrown: unknown) => thrown);

      expect((error as Error).message).toBe('Quest not found: nonexistent-quest');
    });
  });
});
