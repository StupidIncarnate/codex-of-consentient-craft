import {
  AgentIdStub,
  GuildListItemStub,
  QuestIdStub,
  QuestListItemStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { ReconcileWatchersLayerResponder } from './reconcile-watchers-layer-responder';
import { ReconcileWatchersLayerResponderProxy } from './reconcile-watchers-layer-responder.proxy';

describe('ReconcileWatchersLayerResponder', () => {
  it('VALID: {no guilds} => returns 0/0 counts and leaves watchers untouched', async () => {
    ReconcileWatchersLayerResponderProxy();

    const result = await ReconcileWatchersLayerResponder({
      watchers: new Map(),
      projectDir: '/repo',
    });

    expect(result).toStrictEqual({ started: 0, stopped: 0 });
  });

  it('VALID: {active quest with a node-worker item (sessionId, no agentId) + a dispatcher item (sessionId + agentId)} => starts the worker session WITH its workerWorkItemId and the dispatcher session WITHOUT', async () => {
    const proxy = ReconcileWatchersLayerResponderProxy();

    const questId = QuestIdStub({ value: 'my-quest' });
    const workerSessionId = '33333333-3333-3333-3333-333333333333';
    const dispatcherSessionId = '44444444-4444-4444-4444-444444444444';
    const workerWorkItemId = '11111111-1111-1111-1111-111111111111';

    proxy.guildsProxy.returns({ guilds: [GuildListItemStub()] });
    proxy.questsProxy.returns({
      quests: [QuestListItemStub({ id: questId, status: 'in_progress' })],
    });
    proxy.loadQuestProxy.returns({
      quest: QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: workerWorkItemId }),
            role: 'pathseeker',
            status: 'in_progress',
            sessionId: SessionIdStub({ value: workerSessionId }),
          }),
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: '22222222-2222-2222-2222-222222222222' }),
            role: 'codeweaver',
            status: 'in_progress',
            sessionId: SessionIdStub({ value: dispatcherSessionId }),
            agentId: AgentIdStub({ value: 'a750c8bc' }),
          }),
        ],
      }),
    });

    const result = await ReconcileWatchersLayerResponder({
      watchers: new Map(),
      projectDir: '/repo',
    });

    expect(result).toStrictEqual({ started: 2, stopped: 0 });
    expect(
      proxy.startWatcherProxy.startedWithWorkerWorkItemId({
        parentSessionId: workerSessionId,
        workerWorkItemId,
      }),
    ).toBe(true);
    expect(
      proxy.startWatcherProxy.startedWithoutWorkerWorkItemId({
        parentSessionId: dispatcherSessionId,
      }),
    ).toBe(true);
  });
});
