import {
  FlowEdgeStub,
  FlowIdStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  QuestWorkItemIdStub,
  SignoffStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questResetFlowSignoffsBroker } from './quest-reset-flow-signoffs-broker';
import { questResetFlowSignoffsBrokerProxy } from './quest-reset-flow-signoffs-broker.proxy';

// Matches the pin in quest-reset-flow-signoffs-broker.proxy.ts, which fixes both the note's `at`
// and the quest's `updatedAt` so the whole persisted quest can be asserted in one shot.
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

const QUEST_ID = QuestIdStub({ value: 'reset-walk-quest' });
const TARGET_FLOW_ID = FlowIdStub({ value: 'login-flow' });
const OTHER_FLOW_ID = FlowIdStub({ value: 'signup-flow' });

const SIEGE_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' });
const FLOWRIDER_WORK_ITEM_ID = QuestWorkItemIdStub({
  value: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
});
const UNKNOWN_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
const ORPHAN_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd' });

const SIEGE_OP_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000001' });
const FLOWRIDER_OP_ID = OperationItemIdStub({ value: '00000000-0000-4000-8000-000000000002' });

const FLOWRIDER_SIGNOFF = SignoffStub({
  evidence: 'packages/web/src/flows/login/login.e2e.ts:31 — red when the redirect is removed',
  workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  at: '2026-01-01T00:00:00.000Z',
});
const SIEGE_SIGNOFF = SignoffStub({
  evidence: 'walked it against the dev server — landed on /dashboard in 240ms',
  workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  at: '2026-01-02T00:00:00.000Z',
});

const { detail: RESET_REASON } = QuestNoteStub({
  detail:
    'Fixed the redirect guard that swallowed the 302, so every walk before this measured the broken build.',
});

const SIEGE_OPERATION = OperationItemStub({
  id: SIEGE_OP_ID,
  role: 'siegemaster',
  text: 'Siegemaster: manual QA — flow: login-flow',
  status: 'in_progress',
  locked: true,
  flowIds: ['login-flow'],
});

const SIEGE_WORK_ITEM = WorkItemStub({
  id: SIEGE_WORK_ITEM_ID,
  role: 'siegemaster',
  status: 'in_progress',
  relatedDataItems: [`operations/${String(SIEGE_OP_ID)}`],
});

const FLOWRIDER_OPERATION = OperationItemStub({
  id: FLOWRIDER_OP_ID,
  role: 'flowrider',
  text: 'Flowrider: author the flow-perspective suites',
  status: 'in_progress',
  locked: true,
  flowIds: ['login-flow'],
});

const FLOWRIDER_WORK_ITEM = WorkItemStub({
  id: FLOWRIDER_WORK_ITEM_ID,
  role: 'flowrider',
  status: 'in_progress',
  relatedDataItems: [`operations/${String(FLOWRIDER_OP_ID)}`],
});

// A work item carrying no `operations/<id>` ref at all — it declares no flow scope, so there is
// nothing to check the requested flow against.
const ORPHAN_WORK_ITEM = WorkItemStub({
  id: ORPHAN_WORK_ITEM_ID,
  role: 'siegemaster',
  status: 'in_progress',
  relatedDataItems: [],
});

const SIGNED_TARGET_FLOW = FlowStub({
  id: 'login-flow',
  name: 'Login Flow',
  entryPoint: '/login',
  exitPoints: ['/dashboard'],
  nodes: [
    FlowNodeStub({
      id: 'login-page',
      label: 'Login Page',
      flowriderSignoff: FLOWRIDER_SIGNOFF,
      siegemasterSignoff: SIEGE_SIGNOFF,
      observables: [
        FlowObservableStub({
          id: 'login-redirects-to-dashboard',
          flowriderSignoff: FLOWRIDER_SIGNOFF,
          siegemasterSignoff: SIEGE_SIGNOFF,
        }),
      ],
    }),
    // Signed by nobody — proves the reset does not materialise keys on units it never touched.
    FlowNodeStub({ id: 'dashboard', label: 'Dashboard' }),
  ],
  edges: [
    FlowEdgeStub({
      id: 'login-to-dashboard',
      flowriderSignoff: FLOWRIDER_SIGNOFF,
      siegemasterSignoff: SIEGE_SIGNOFF,
    }),
  ],
  offMapSignoffs: [
    FlowOffMapSignoffStub({
      id: 'concurrency',
      flowriderSignoff: FLOWRIDER_SIGNOFF,
      siegemasterSignoff: SIEGE_SIGNOFF,
    }),
  ],
});

// A SECOND flow on the same quest, signed on both tracks. The reset must not touch a single key
// on it — it is outside the requested flow, whatever the operation item's scope says.
const UNTOUCHED_OTHER_FLOW = FlowStub({
  id: 'signup-flow',
  name: 'Signup Flow',
  entryPoint: '/signup',
  exitPoints: ['/welcome'],
  nodes: [
    FlowNodeStub({
      id: 'signup-page',
      label: 'Signup Page',
      flowriderSignoff: FLOWRIDER_SIGNOFF,
      siegemasterSignoff: SIEGE_SIGNOFF,
      observables: [
        FlowObservableStub({
          id: 'signup-creates-account',
          description: 'creates the account',
          flowriderSignoff: FLOWRIDER_SIGNOFF,
          siegemasterSignoff: SIEGE_SIGNOFF,
        }),
      ],
    }),
  ],
  edges: [],
  offMapSignoffs: [
    FlowOffMapSignoffStub({
      id: 'staleness',
      flowriderSignoff: FLOWRIDER_SIGNOFF,
      siegemasterSignoff: SIEGE_SIGNOFF,
    }),
  ],
});

const UNSIGNED_TARGET_FLOW = FlowStub({
  id: 'login-flow',
  name: 'Login Flow',
  entryPoint: '/login',
  exitPoints: ['/dashboard'],
  nodes: [FlowNodeStub({ id: 'login-page', label: 'Login Page' })],
  edges: [FlowEdgeStub({ id: 'login-to-dashboard' })],
  offMapSignoffs: [FlowOffMapSignoffStub({ id: 'concurrency' })],
});

describe('questResetFlowSignoffsBroker', () => {
  describe('successful reset', () => {
    it('VALID: {flow signed on both tracks} => persists a quest whose every siegemasterSignoff key is GONE, every flowriderSignoff intact, a walk-reset note appended, and the second flow byte-identical', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [SIEGE_OPERATION],
          workItems: [SIEGE_WORK_ITEM],
          flows: [SIGNED_TARGET_FLOW, UNTOUCHED_OTHER_FLOW],
        }),
      });

      const result = await questResetFlowSignoffsBroker({
        questId: QUEST_ID,
        workItemId: SIEGE_WORK_ITEM_ID,
        flowId: TARGET_FLOW_ID,
        reason: RESET_REASON,
      });

      expect(result).toStrictEqual({ clearedCount: 4, noteId: 'walk-reset-login-flow-1' });

      expect(proxy.getPersistedQuests()).toStrictEqual([
        {
          id: 'reset-walk-quest',
          folder: '001-add-auth',
          title: 'Add Authentication',
          status: 'in_progress',
          questType: 'feature',
          createdAt: '2024-01-15T10:00:00.000Z',
          updatedAt: FIXED_TIMESTAMP,
          designDecisions: [],
          operations: [
            {
              id: '00000000-0000-4000-8000-000000000001',
              role: 'siegemaster',
              text: 'Siegemaster: manual QA — flow: login-flow',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
              packageNames: [],
            },
          ],
          toolingRequirements: [],
          packagesAffected: [],
          packageGraph: [],
          contracts: [],
          flows: [
            {
              id: 'login-flow',
              name: 'Login Flow',
              flowType: 'runtime',
              entryPoint: '/login',
              exitPoints: ['/dashboard'],
              nodes: [
                {
                  id: 'login-page',
                  label: 'Login Page',
                  type: 'state',
                  packages: ['auth-service'],
                  observables: [
                    {
                      id: 'login-redirects-to-dashboard',
                      type: 'ui-state',
                      package: 'auth-service',
                      description: 'redirects to dashboard',
                      addedBy: 'spec',
                      flowriderSignoff: FLOWRIDER_SIGNOFF,
                    },
                  ],
                  flowriderSignoff: FLOWRIDER_SIGNOFF,
                },
                {
                  id: 'dashboard',
                  label: 'Dashboard',
                  type: 'state',
                  packages: ['auth-service'],
                  observables: [],
                },
              ],
              edges: [
                {
                  id: 'login-to-dashboard',
                  from: 'login-page',
                  to: 'dashboard',
                  flowriderSignoff: FLOWRIDER_SIGNOFF,
                },
              ],
              offMapSignoffs: [{ id: 'concurrency', flowriderSignoff: FLOWRIDER_SIGNOFF }],
            },
            UNTOUCHED_OTHER_FLOW,
          ],
          comments: [],
          needsDesign: false,
          userRequest: 'Add authentication to the application',
          workItems: [
            {
              id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              role: 'siegemaster',
              status: 'in_progress',
              spawnerType: 'agent',
              relatedDataItems: ['operations/00000000-0000-4000-8000-000000000001'],
              dependsOn: [],
              attempt: 0,
              maxAttempts: 1,
              retryCount: 0,
              createdAt: '2024-01-15T10:00:00.000Z',
            },
          ],
          wardResults: [],
          riftcarverResults: [],
          planningNotes: {
            blightLedger: [],
            questNotes: [
              {
                id: 'walk-reset-login-flow-1',
                kind: 'walk-reset',
                role: 'siegemaster',
                workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                flowId: 'login-flow',
                summary: 'Siegemaster walk reset for flow login-flow — 4 sign-off(s) cleared',
                detail: RESET_REASON,
                at: FIXED_TIMESTAMP,
              },
            ],
            operationPlans: [],
          },
        },
      ]);
    });

    it('EDGE: {flow carrying zero sign-offs} => succeeds with clearedCount 0 and still appends the walk-reset note', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [SIEGE_OPERATION],
          workItems: [SIEGE_WORK_ITEM],
          flows: [UNSIGNED_TARGET_FLOW],
        }),
      });

      const result = await questResetFlowSignoffsBroker({
        questId: QUEST_ID,
        workItemId: SIEGE_WORK_ITEM_ID,
        flowId: TARGET_FLOW_ID,
        reason: RESET_REASON,
      });

      const [persisted] = proxy.getPersistedQuests();
      const { planningNotes, flows } = persisted as ReturnType<typeof QuestStub>;

      expect(result).toStrictEqual({ clearedCount: 0, noteId: 'walk-reset-login-flow-1' });
      expect(planningNotes.questNotes).toStrictEqual([
        {
          id: 'walk-reset-login-flow-1',
          kind: 'walk-reset',
          role: 'siegemaster',
          workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          flowId: 'login-flow',
          summary: 'Siegemaster walk reset for flow login-flow — 0 sign-off(s) cleared',
          detail: RESET_REASON,
          at: FIXED_TIMESTAMP,
        },
      ]);
      expect(flows).toStrictEqual([UNSIGNED_TARGET_FLOW]);
    });

    it('VALID: {a walk-reset note already exists for this flow} => the second note is numbered 2 rather than colliding on the first id', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [SIEGE_OPERATION],
          workItems: [SIEGE_WORK_ITEM],
          flows: [UNSIGNED_TARGET_FLOW],
          planningNotes: {
            blightLedger: [],
            questNotes: [
              QuestNoteStub({
                id: 'walk-reset-login-flow-1',
                kind: 'walk-reset',
                role: 'siegemaster',
                workItemId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                flowId: 'login-flow',
                summary: 'Siegemaster walk reset for flow login-flow — 4 sign-off(s) cleared',
                detail: 'The first reset, after the redirect fix.',
                at: '2026-01-03T00:00:00.000Z',
              }),
            ],
            operationPlans: [],
          },
        }),
      });

      const result = await questResetFlowSignoffsBroker({
        questId: QUEST_ID,
        workItemId: SIEGE_WORK_ITEM_ID,
        flowId: TARGET_FLOW_ID,
        reason: RESET_REASON,
      });

      const [persisted] = proxy.getPersistedQuests();
      const { planningNotes } = persisted as ReturnType<typeof QuestStub>;

      expect(result).toStrictEqual({ clearedCount: 0, noteId: 'walk-reset-login-flow-2' });
      expect(planningNotes.questNotes.map((note) => String(note.id))).toStrictEqual([
        'walk-reset-login-flow-1',
        'walk-reset-login-flow-2',
      ]);
    });
  });

  describe('ownership', () => {
    it('INVALID: {flowId outside the operation item scope} => rejects naming the flow and the work item, persisting nothing', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [SIEGE_OPERATION],
          workItems: [SIEGE_WORK_ITEM],
          flows: [SIGNED_TARGET_FLOW, UNTOUCHED_OTHER_FLOW],
        }),
      });

      await expect(
        questResetFlowSignoffsBroker({
          questId: QUEST_ID,
          workItemId: SIEGE_WORK_ITEM_ID,
          flowId: OTHER_FLOW_ID,
          reason: RESET_REASON,
        }),
      ).rejects.toThrow(
        /^reset-flow-signoffs: flow signup-flow is outside the scope of work item aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa, whose operation item 00000000-0000-4000-8000-000000000001 covers login-flow — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('INVALID: {a flowrider work item asks for a reset} => rejects, only siegemaster owns this track', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [FLOWRIDER_OPERATION],
          workItems: [FLOWRIDER_WORK_ITEM],
          flows: [SIGNED_TARGET_FLOW],
        }),
      });

      await expect(
        questResetFlowSignoffsBroker({
          questId: QUEST_ID,
          workItemId: FLOWRIDER_WORK_ITEM_ID,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
        }),
      ).rejects.toThrow(
        /^reset-flow-signoffs: only a siegemaster work item may reset a walk — work item bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb is linked to a flowrider operation item \(00000000-0000-4000-8000-000000000002\)$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('INVALID: {work item with no operations/ ref} => rejects, it declares no flow scope to check against', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [SIEGE_OPERATION],
          workItems: [ORPHAN_WORK_ITEM],
          flows: [SIGNED_TARGET_FLOW],
        }),
      });

      await expect(
        questResetFlowSignoffsBroker({
          questId: QUEST_ID,
          workItemId: ORPHAN_WORK_ITEM_ID,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
        }),
      ).rejects.toThrow(
        /^reset-flow-signoffs: work item dddddddd-dddd-4ddd-8ddd-dddddddddddd has no linked operation item on quest reset-walk-quest, so it declares no flow scope — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('error cases', () => {
    it('ERROR: {workItemId not on the quest} => throws naming the unknown work item, persisting nothing', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [SIEGE_OPERATION],
          workItems: [SIEGE_WORK_ITEM],
          flows: [SIGNED_TARGET_FLOW],
        }),
      });

      await expect(
        questResetFlowSignoffsBroker({
          questId: QUEST_ID,
          workItemId: UNKNOWN_WORK_ITEM_ID,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
        }),
      ).rejects.toThrow(
        /^reset-flow-signoffs: work item cccccccc-cccc-4ccc-8ccc-cccccccccccc is not on quest reset-walk-quest — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('ERROR: {flowId in scope but absent from the quest} => throws naming the missing flow', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestFound({
        quest: QuestStub({
          id: QUEST_ID,
          operations: [SIEGE_OPERATION],
          workItems: [SIEGE_WORK_ITEM],
          flows: [UNTOUCHED_OTHER_FLOW],
        }),
      });

      await expect(
        questResetFlowSignoffsBroker({
          questId: QUEST_ID,
          workItemId: SIEGE_WORK_ITEM_ID,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
        }),
      ).rejects.toThrow(
        /^reset-flow-signoffs: flow login-flow is not on quest reset-walk-quest — nothing was reset$/u,
      );

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });

    it('ERROR: {quest not found} => rejects with QuestNotFoundError, persisting nothing', async () => {
      const proxy = questResetFlowSignoffsBrokerProxy();
      proxy.setupQuestNotFound();

      await expect(
        questResetFlowSignoffsBroker({
          questId: QUEST_ID,
          workItemId: SIEGE_WORK_ITEM_ID,
          flowId: TARGET_FLOW_ID,
          reason: RESET_REASON,
        }),
      ).rejects.toThrow(/unknown/u);

      expect(proxy.getPersistedQuests()).toStrictEqual([]);
    });
  });
});
