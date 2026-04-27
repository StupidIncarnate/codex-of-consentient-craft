import {
  QuestIdStub,
  QuestQueueEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { ExecutionQueueGetAllResponder } from './execution-queue-get-all-responder';
import { ExecutionQueueGetAllResponderProxy } from './execution-queue-get-all-responder.proxy';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';

describe('ExecutionQueueGetAllResponder', () => {
  it('EMPTY: {no entries} => returns empty array', async () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupEmpty();

    await expect(ExecutionQueueGetAllResponder()).resolves.toStrictEqual([]);
  });

  it('VALID: {entry without cached activeSessionId, quest has in-progress codeweaver} => returns entry with re-derived activeSessionId', async () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupEmpty();

    const questId = QuestIdStub({ value: 'add-auth' });
    const sessionId = SessionIdStub({ value: '73b3df26-bef0-491b-ae00-201e4a655dff' });
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub(),
      role: 'codeweaver',
      status: 'in_progress',
      sessionId,
    });
    const quest = QuestStub({ id: questId, workItems: [workItem] });
    proxy.setupQuestFound({ quest });

    const entry = QuestQueueEntryStub({ questId });
    questExecutionQueueState.enqueue({ entry });

    const result = await ExecutionQueueGetAllResponder();

    expect(result).toStrictEqual([{ ...entry, activeSessionId: sessionId }]);
  });

  it('VALID: {entry has stale activeSessionId, quest has fresh codeweaver session} => overrides with re-derived value', async () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupEmpty();

    const questId = QuestIdStub({ value: 'add-auth' });
    const staleSessionId = SessionIdStub({ value: '11111111-1111-4111-8111-111111111111' });
    const freshSessionId = SessionIdStub({ value: '73b3df26-bef0-491b-ae00-201e4a655dff' });
    const workItem = WorkItemStub({
      id: QuestWorkItemIdStub(),
      role: 'codeweaver',
      status: 'in_progress',
      sessionId: freshSessionId,
    });
    const quest = QuestStub({ id: questId, workItems: [workItem] });
    proxy.setupQuestFound({ quest });

    const entry = QuestQueueEntryStub({ questId, activeSessionId: staleSessionId });
    questExecutionQueueState.enqueue({ entry });

    const result = await ExecutionQueueGetAllResponder();

    expect(result).toStrictEqual([{ ...entry, activeSessionId: freshSessionId }]);
  });

  it('VALID: {entry has cached activeSessionId, quest has no session-bearing workItems} => strips activeSessionId', async () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupEmpty();

    const questId = QuestIdStub({ value: 'add-auth' });
    const cachedSessionId = SessionIdStub({ value: '11111111-1111-4111-8111-111111111111' });
    const quest = QuestStub({ id: questId, workItems: [] });
    proxy.setupQuestFound({ quest });

    const entry = QuestQueueEntryStub({ questId, activeSessionId: cachedSessionId });
    questExecutionQueueState.enqueue({ entry });

    const [first] = await ExecutionQueueGetAllResponder();

    expect(first?.activeSessionId).toBe(undefined);
  });

  it('VALID: {quest load fails} => falls back to entry as-is without throwing', async () => {
    const proxy = ExecutionQueueGetAllResponderProxy();
    proxy.setupEmpty();
    proxy.setupQuestNotFound();

    const cachedSessionId = SessionIdStub({ value: '11111111-1111-4111-8111-111111111111' });
    const entry = QuestQueueEntryStub({ activeSessionId: cachedSessionId });
    questExecutionQueueState.enqueue({ entry });

    const result = await ExecutionQueueGetAllResponder();

    expect(result).toStrictEqual([entry]);
  });
});
