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

    const guild = GuildListItemStub();
    proxy.guildsProxy.returns({ guilds: [guild] });
    proxy.questsProxy.returns({
      guildId: guild.id,
      quests: [QuestListItemStub({ id: questId, status: 'in_progress' })],
    });
    proxy.loadQuestProxy.returns({
      questId,
      quest: QuestStub({
        id: questId,
        workItems: [
          WorkItemStub({
            id: QuestWorkItemIdStub({ value: workerWorkItemId }),
            role: 'codeweaver',
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
    proxy.startWatcherProxy.resolves({ parentSessionId: workerSessionId });
    proxy.startWatcherProxy.resolves({ parentSessionId: dispatcherSessionId });

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
      proxy.startWatcherProxy.startedWithWorkerQuestId({
        parentSessionId: workerSessionId,
        workerQuestId: String(questId),
      }),
    ).toBe(true);
    expect(
      proxy.startWatcherProxy.startedWithoutWorkerWorkItemId({
        parentSessionId: dispatcherSessionId,
      }),
    ).toBe(true);
  });

  describe('spec-phase quests', () => {
    // A spec-phase quest's intake work item carries the session id of the conversation the user is
    // having RIGHT NOW. If these statuses are filtered out, no tail is started and the browser chat
    // panel stays empty for the whole intake — the reason /dumpster-create and /dumpster-hunt
    // appeared to "not hook up".
    it.each(['created', 'explore_flows', 'review_flows', 'flows_approved'] as const)(
      'VALID: {quest status: %s with an active intake item carrying a sessionId} => starts a tail for that session',
      async (status) => {
        const proxy = ReconcileWatchersLayerResponderProxy();

        const questId = QuestIdStub({ value: 'spec-phase-quest' });
        const intakeSessionId = '55555555-5555-5555-5555-555555555555';
        const intakeWorkItemId = '66666666-6666-6666-6666-666666666666';

        const guild = GuildListItemStub();
        proxy.guildsProxy.returns({ guilds: [guild] });
        proxy.questsProxy.returns({
          guildId: guild.id,
          quests: [QuestListItemStub({ id: questId, status })],
        });
        proxy.loadQuestProxy.returns({
          questId,
          quest: QuestStub({
            id: questId,
            status,
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: intakeWorkItemId }),
                role: 'bughunt',
                status: 'in_progress',
                sessionId: SessionIdStub({ value: intakeSessionId }),
              }),
            ],
          }),
        });
        proxy.startWatcherProxy.resolves({ parentSessionId: intakeSessionId });

        const result = await ReconcileWatchersLayerResponder({
          watchers: new Map(),
          projectDir: '/repo',
        });

        expect(result).toStrictEqual({ started: 1, stopped: 0 });
        expect(
          proxy.startWatcherProxy.startedWithWorkerWorkItemId({
            parentSessionId: intakeSessionId,
            workerWorkItemId: intakeWorkItemId,
          }),
        ).toBe(true);
      },
    );
  });

  describe('terminal quests', () => {
    // Covers the finished-quest-with-no-post-quest-session case: the summary carries no
    // activeSessionId, so the pre-filter still excludes it and no quest.json is ever loaded for it.
    // This is the reason the pre-filter still exists.
    it.each(['complete', 'abandoned'] as const)(
      'EMPTY: {quest status: %s} => starts no tail even though a work item carries a sessionId',
      async (status) => {
        const proxy = ReconcileWatchersLayerResponderProxy();

        const questId = QuestIdStub({ value: 'terminal-quest' });

        const guild = GuildListItemStub();
        proxy.guildsProxy.returns({ guilds: [guild] });
        proxy.questsProxy.returns({
          guildId: guild.id,
          quests: [QuestListItemStub({ id: questId, status })],
        });

        const result = await ReconcileWatchersLayerResponder({
          watchers: new Map(),
          projectDir: '/repo',
        });

        expect(result).toStrictEqual({ started: 0, stopped: 0 });
      },
    );

    it.each(['complete', 'merged'] as const)(
      'VALID: {quest status: %s carrying an in_progress tavernkeeper item with a sessionId} => starts a tail for that session',
      async (status) => {
        const proxy = ReconcileWatchersLayerResponderProxy();

        const questId = QuestIdStub({ value: 'terminal-quest-with-followup' });
        const followupSessionId = '77777777-7777-7777-7777-777777777777';
        const followupWorkItemId = '88888888-8888-8888-8888-888888888888';

        const guild = GuildListItemStub();
        proxy.guildsProxy.returns({ guilds: [guild] });
        proxy.questsProxy.returns({
          guildId: guild.id,
          quests: [
            QuestListItemStub({
              id: questId,
              status,
              activeSessionId: SessionIdStub({ value: followupSessionId }),
            }),
          ],
        });
        proxy.loadQuestProxy.returns({
          questId,
          quest: QuestStub({
            id: questId,
            status,
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: followupWorkItemId }),
                role: 'tavernkeeper',
                status: 'in_progress',
                sessionId: SessionIdStub({ value: followupSessionId }),
              }),
            ],
          }),
        });
        proxy.startWatcherProxy.resolves({ parentSessionId: followupSessionId });

        const result = await ReconcileWatchersLayerResponder({
          watchers: new Map(),
          projectDir: '/repo',
        });

        expect(result).toStrictEqual({ started: 1, stopped: 0 });
        expect(
          proxy.startWatcherProxy.startedWithWorkerWorkItemId({
            parentSessionId: followupSessionId,
            workerWorkItemId: followupWorkItemId,
          }),
        ).toBe(true);
        // The follow-up tail and the tavernkeeper spawn deliver ONE turn under two process
        // identities, and only the spawn's ends. Without the questId the tail's own terminal
        // event reaches no subscriber, so the drain that arrives after the turn ended re-arms
        // the composer and it holds STOP forever.
        expect(
          proxy.startWatcherProxy.startedWithWorkerQuestId({
            parentSessionId: followupSessionId,
            workerQuestId: String(questId),
          }),
        ).toBe(true);
      },
    );

    it('EMPTY: {quest status: merged, activeSessionId present but its tavernkeeper item is complete} => starts no tail', async () => {
      const proxy = ReconcileWatchersLayerResponderProxy();

      const questId = QuestIdStub({ value: 'terminal-quest-idle-followup' });
      const followupSessionId = '99999999-9999-9999-9999-999999999999';
      const followupWorkItemId = '10101010-1010-1010-1010-101010101010';

      const guild = GuildListItemStub();
      proxy.guildsProxy.returns({ guilds: [guild] });
      proxy.questsProxy.returns({
        guildId: guild.id,
        quests: [
          QuestListItemStub({
            id: questId,
            status: 'merged',
            activeSessionId: SessionIdStub({ value: followupSessionId }),
          }),
        ],
      });
      proxy.loadQuestProxy.returns({
        questId,
        quest: QuestStub({
          id: questId,
          status: 'merged',
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: followupWorkItemId }),
              role: 'tavernkeeper',
              status: 'complete',
              sessionId: SessionIdStub({ value: followupSessionId }),
            }),
          ],
        }),
      });

      const result = await ReconcileWatchersLayerResponder({
        watchers: new Map(),
        projectDir: '/repo',
      });

      expect(result).toStrictEqual({ started: 0, stopped: 0 });
    });
  });
});
