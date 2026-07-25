import {
  ExitCodeStub,
  FileContentsStub,
  FileNameStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { QuestRunWardResponderProxy } from './quest-run-ward-responder.proxy';

const WARD_WORK_ITEM_ID = 'a1a1a1a1-b2b2-c3c3-d4d4-e5e5e5e5e5e5';

describe('QuestRunWardResponder', () => {
  it('VALID: {exitCode 0, mode: changed} => delegates to broker and returns full QuestRunWardResult', async () => {
    const proxy = QuestRunWardResponderProxy();
    const questId = QuestIdStub({ value: 'test-quest' });
    const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
    const runId = FileNameStub({ value: '1739625600000-a3f1' });
    const workItem = WorkItemStub({
      id: workItemId,
      role: 'ward',
      status: 'in_progress',
      spawnerType: 'command',
      maxAttempts: 3,
    });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [workItem],
    });

    proxy.setupQuest({ quest });
    proxy.wardExits({
      exitCode: ExitCodeStub({ value: 0 }),
      runId,
      detailJson: FileContentsStub({ value: '{"checks":[]}' }),
    });

    const result = await proxy.callResponder({ questId, workItemId, mode: 'changed' });

    expect(result).toStrictEqual({
      success: true,
      questId,
      workItemId,
      exitCode: ExitCodeStub({ value: 0 }),
      wardResultId: result.wardResultId,
      lastWardRunId: runId,
    });
  });

  // Ward is `spawnerType: 'command'` with no sessionId, so the JSONL watcher can never tail it.
  // This emit is the ONLY route its output has to the workspace.
  it('VALID: {ward runs} => emits every ward line as a chat-output entry keyed on the ward work item', async () => {
    const proxy = QuestRunWardResponderProxy();
    const questId = QuestIdStub({ value: 'test-quest' });
    const workItemId = QuestWorkItemIdStub({ value: WARD_WORK_ITEM_ID });
    const runId = FileNameStub({ value: '1739625600000-a3f1' });
    const quest = QuestStub({
      id: questId,
      status: 'in_progress',
      workItems: [
        WorkItemStub({
          id: workItemId,
          role: 'ward',
          status: 'pending',
          spawnerType: 'command',
          maxAttempts: 3,
        }),
      ],
    });

    proxy.setupQuest({ quest });
    proxy.wardExits({
      exitCode: ExitCodeStub({ value: 0 }),
      runId,
      detailJson: FileContentsStub({ value: '{"checks":[]}' }),
    });
    const emits = proxy.captureWardChatEmits();

    await proxy.callResponder({ questId, workItemId, mode: 'changed' });

    // One emit per ward line, each routed to the ward work item so the execution panel groups
    // them under its row. That the line CONTENT reaches the callback is covered by the broker's
    // own `streams every ward line to onLine` test.
    expect(emits.getProcessIds()).toStrictEqual([WARD_WORK_ITEM_ID, WARD_WORK_ITEM_ID]);
  });
});
