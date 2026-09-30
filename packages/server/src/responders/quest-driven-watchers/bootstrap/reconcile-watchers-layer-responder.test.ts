import { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import { QuestIdStub } from '@dungeonmaster/shared/contracts/quest-id/quest-id.stub';
import { QuestSessionStub } from '@dungeonmaster/shared/contracts/quest-session/quest-session.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { QuestWorkItemIdStub } from '@dungeonmaster/shared/contracts/quest-work-item-id/quest-work-item-id.stub';
import { SessionIdStub } from '@dungeonmaster/shared/contracts/session-id/session-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

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

  it('VALID: {active quest with two node-worker items, each its own sessionId} => starts each session WITH its own workerWorkItemId and the quest workerQuestId', async () => {
    const proxy = ReconcileWatchersLayerResponderProxy();

    const questId = QuestIdStub({ value: 'my-quest' });
    const firstSessionId = '33333333-3333-3333-3333-333333333333';
    const secondSessionId = '44444444-4444-4444-4444-444444444444';
    const firstWorkItemId = QuestWorkItemIdStub({ value: '11111111-1111-4111-8111-111111111111' });
    const secondWorkItemId = QuestWorkItemIdStub({ value: '22222222-2222-4222-8222-222222222222' });

    const guild = GuildListItemStub();
    proxy.guildsProxy.returns({ guilds: [guild] });
    proxy.questsProxy.returns({
      guildId: guild.id,
      quests: [
        QuestStub({
          id: questId,
          workItems: [
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: firstWorkItemId }),
              role: 'codeweaver',
              status: 'in_progress',
              sessionId: SessionIdStub({ value: firstSessionId }),
            }),
            WorkItemStub({
              id: QuestWorkItemIdStub({ value: secondWorkItemId }),
              role: 'codeweaver',
              status: 'in_progress',
              sessionId: SessionIdStub({ value: secondSessionId }),
            }),
          ],
        }),
      ],
    });
    proxy.startWatcherProxy.resolves({ parentSessionId: firstSessionId });
    proxy.startWatcherProxy.resolves({ parentSessionId: secondSessionId });

    const result = await ReconcileWatchersLayerResponder({
      watchers: new Map(),
      projectDir: '/repo',
    });

    expect(result).toStrictEqual({ started: 2, stopped: 0 });
    expect(
      proxy.startWatcherProxy.startedWithWorkerWorkItemId({
        parentSessionId: firstSessionId,
        workerWorkItemId: firstWorkItemId,
      }),
    ).toBe(true);
    expect(
      proxy.startWatcherProxy.startedWithWorkerQuestId({
        parentSessionId: firstSessionId,
        workerQuestId: String(questId),
      }),
    ).toBe(true);
    expect(
      proxy.startWatcherProxy.startedWithWorkerWorkItemId({
        parentSessionId: secondSessionId,
        workerWorkItemId: secondWorkItemId,
      }),
    ).toBe(true);
    expect(
      proxy.startWatcherProxy.startedWithWorkerQuestId({
        parentSessionId: secondSessionId,
        workerQuestId: String(questId),
      }),
    ).toBe(true);
  });

  // Claude CLI encodes the JSONL directory from the child's own cwd, so the tail's address is a
  // property of the SESSION. A quest's own `worktreePath` is the fallback used only for a session
  // the quest recorded no row for, and it is right just while every session on the quest shares one
  // cwd — which stops being true the moment riftcarver carves.
  describe('project dir follows the session cwd, falling back to the quest', () => {
    it('VALID: {carved quest, no sessions row, active worker session} => falls back to the WORKTREE, not the guild path', async () => {
      const proxy = ReconcileWatchersLayerResponderProxy();

      const questId = QuestIdStub({ value: 'carved-quest' });
      const workerSessionId = '35fd5b8f-551b-8baf-b8fb-a5c4702e7b71';
      const worktreePath = '/repo/worktrees/add-auth-a1b2c3d4';

      const guild = GuildListItemStub();
      proxy.guildsProxy.returns({ guilds: [guild] });
      proxy.questsProxy.returns({
        guildId: guild.id,
        quests: [
          QuestStub({
            id: questId,
            worktreePath,
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: '97241aaa-ae56-6f58-b9ec-a952ee85b407' }),
                role: 'codeweaver',
                status: 'in_progress',
                sessionId: SessionIdStub({ value: workerSessionId }),
              }),
            ],
          }),
        ],
      });
      proxy.startWatcherProxy.resolves({ parentSessionId: workerSessionId });

      await ReconcileWatchersLayerResponder({ watchers: new Map(), projectDir: '/repo' });

      expect(
        proxy.startWatcherProxy.startedWithProjectDir({
          parentSessionId: workerSessionId,
          projectDir: worktreePath,
        }),
      ).toBe(true);
    });

    it('VALID: {carved quest whose sessions row places this session at the REPO ROOT} => starts the tail there, not at the worktree', async () => {
      const proxy = ReconcileWatchersLayerResponderProxy();

      const questId = QuestIdStub({ value: 'carved-quest' });
      const intakeSessionId = 'e0047cb8-02a2-448f-a1cb-909c9681f999';
      const worktreePath = '/repo/worktrees/add-auth-a1b2c3d4';

      const guild = GuildListItemStub();
      proxy.guildsProxy.returns({ guilds: [guild] });
      proxy.questsProxy.returns({
        guildId: guild.id,
        quests: [
          QuestStub({
            id: questId,
            worktreePath,
            sessions: [
              QuestSessionStub({
                sessionId: SessionIdStub({ value: intakeSessionId }),
                cwd: '/repo',
                role: 'chaoswhisperer',
              }),
            ],
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: '97241aaa-ae56-6f58-b9ec-a952ee85b407' }),
                role: 'chaoswhisperer',
                status: 'in_progress',
                sessionId: SessionIdStub({ value: intakeSessionId }),
              }),
            ],
          }),
        ],
      });
      proxy.startWatcherProxy.resolves({ parentSessionId: intakeSessionId });

      // The responder's own fallback is deliberately NOT '/repo', so a map miss falling through to
      // it can never be mistaken for the row being read.
      await ReconcileWatchersLayerResponder({
        watchers: new Map(),
        projectDir: '/never-used-fallback',
      });

      expect(
        proxy.startWatcherProxy.startedWithProjectDir({
          parentSessionId: intakeSessionId,
          projectDir: '/repo',
        }),
      ).toBe(true);
    });

    it('VALID: {one sessionId across TWO quests, only the SECOND recording a row} => uses the recorded cwd, not the first quest guess', async () => {
      const proxy = ReconcileWatchersLayerResponderProxy();

      const sharedSessionId = 'e0047cb8-02a2-448f-a1cb-909c9681f999';
      const worktreePath = '/repo/worktrees/add-auth-a1b2c3d4';

      const guild = GuildListItemStub();
      proxy.guildsProxy.returns({ guilds: [guild] });
      proxy.questsProxy.returns({
        guildId: guild.id,
        quests: [
          QuestStub({
            id: QuestIdStub({ value: 'guessing-quest' }),
            folder: '001-guessing-quest',
            worktreePath,
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: '97241aaa-ae56-6f58-b9ec-a952ee85b407' }),
                role: 'codeweaver',
                status: 'in_progress',
                sessionId: SessionIdStub({ value: sharedSessionId }),
              }),
            ],
          }),
          QuestStub({
            id: QuestIdStub({ value: 'recording-quest' }),
            folder: '002-recording-quest',
            worktreePath,
            sessions: [
              QuestSessionStub({
                sessionId: SessionIdStub({ value: sharedSessionId }),
                cwd: '/repo',
                role: 'codeweaver',
              }),
            ],
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: 'a979fd6f-6969-1e05-b65b-fd78e7c13ea6' }),
                role: 'codeweaver',
                status: 'in_progress',
                sessionId: SessionIdStub({ value: sharedSessionId }),
              }),
            ],
          }),
        ],
      });
      proxy.startWatcherProxy.resolves({ parentSessionId: sharedSessionId });

      await ReconcileWatchersLayerResponder({
        watchers: new Map(),
        projectDir: '/never-used-fallback',
      });

      expect(
        proxy.startWatcherProxy.startedWithProjectDir({
          parentSessionId: sharedSessionId,
          projectDir: '/repo',
        }),
      ).toBe(true);
    });

    it('VALID: {spec-phase quest, no sessions row, active intake session} => keeps the guild path, because no worktree exists to run in', async () => {
      const proxy = ReconcileWatchersLayerResponderProxy();

      const questId = QuestIdStub({ value: 'spec-quest' });
      const intakeSessionId = '9f7abf0d-ce8a-518c-9781-61bfa3057384';

      const guild = GuildListItemStub();
      proxy.guildsProxy.returns({ guilds: [guild] });
      proxy.questsProxy.returns({
        guildId: guild.id,
        quests: [
          QuestStub({
            id: questId,
            status: 'explore_flows',
            workItems: [
              WorkItemStub({
                id: QuestWorkItemIdStub({ value: '88888888-8888-8888-8888-888888888888' }),
                role: 'chaoswhisperer',
                status: 'in_progress',
                sessionId: SessionIdStub({ value: intakeSessionId }),
              }),
            ],
          }),
        ],
      });
      proxy.startWatcherProxy.resolves({ parentSessionId: intakeSessionId });

      await ReconcileWatchersLayerResponder({ watchers: new Map(), projectDir: '/repo' });

      expect(
        proxy.startWatcherProxy.startedWithProjectDir({
          parentSessionId: intakeSessionId,
          projectDir: String(guild.path),
        }),
      ).toBe(true);
    });
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
        const intakeSessionId = '35fd5b8f-551b-8baf-b8fb-a5c4702e7b71';
        const intakeWorkItemId = QuestWorkItemIdStub({
          value: '97241aaa-ae56-6f58-b9ec-a952ee85b407',
        });

        const guild = GuildListItemStub();
        proxy.guildsProxy.returns({ guilds: [guild] });
        proxy.questsProxy.returns({
          guildId: guild.id,
          quests: [
            QuestStub({
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
          ],
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
    // The pair below is the whole rule for a finished quest, and quest STATUS is not part of it:
    // an ACTIVE work item carrying a sessionId gets a tail, a terminal one does not. A finished
    // quest is in scope precisely because a follow-up chat and a merge both run after it ended.
    it.each(['complete', 'abandoned'] as const)(
      'EMPTY: {quest status: %s whose only session belongs to a COMPLETE work item} => starts no tail',
      async (status) => {
        const proxy = ReconcileWatchersLayerResponderProxy();

        const questId = QuestIdStub({ value: 'terminal-quest' });
        const spentSessionId = '12121212-1212-4121-8121-121212121212';

        const guild = GuildListItemStub();
        proxy.guildsProxy.returns({ guilds: [guild] });
        proxy.questsProxy.returns({
          guildId: guild.id,
          quests: [
            QuestStub({
              id: questId,
              status,
              workItems: [
                WorkItemStub({
                  id: QuestWorkItemIdStub({ value: '13131313-1313-4131-8131-131313131313' }),
                  role: 'codeweaver',
                  status: 'complete',
                  sessionId: SessionIdStub({ value: spentSessionId }),
                }),
              ],
            }),
          ],
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
        const followupSessionId = '9f7abf0d-ce8a-518c-9781-61bfa3057384';
        const followupWorkItemId = QuestWorkItemIdStub({
          value: '88888888-8888-8888-8888-888888888888',
        });

        const guild = GuildListItemStub();
        proxy.guildsProxy.returns({ guilds: [guild] });
        proxy.questsProxy.returns({
          guildId: guild.id,
          quests: [
            QuestStub({
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
          ],
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

    it('EMPTY: {quest status: merged whose tavernkeeper item is complete} => starts no tail', async () => {
      const proxy = ReconcileWatchersLayerResponderProxy();

      const questId = QuestIdStub({ value: 'terminal-quest-idle-followup' });
      const followupSessionId = 'a979fd6f-6969-1e05-b65b-fd78e7c13ea6';
      const followupWorkItemId = 'd35f445f-ae0c-259a-8d6a-1ae9c6fe432f';

      const guild = GuildListItemStub();
      proxy.guildsProxy.returns({ guilds: [guild] });
      proxy.questsProxy.returns({
        guildId: guild.id,
        quests: [
          QuestStub({
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
        ],
      });

      const result = await ReconcileWatchersLayerResponder({
        watchers: new Map(),
        projectDir: '/repo',
      });

      expect(result).toStrictEqual({ started: 0, stopped: 0 });
    });
  });
});
