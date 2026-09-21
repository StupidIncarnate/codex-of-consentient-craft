import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  QuestIdStub,
  QuestNoteStub,
  QuestStub,
  QuestWorkItemIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanBatchStub } from '../../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanPayloadCodeweaverStub } from '../../../contracts/work-plan-payload-codeweaver/work-plan-payload-codeweaver.stub';
import { WorkPlanPieceStub } from '../../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { questGetQuestWorkBroker } from './quest-get-quest-work-broker';
import { questGetQuestWorkBrokerProxy } from './quest-get-quest-work-broker.proxy';

const QUEST_ID = QuestIdStub({ value: 'add-auth' });
const WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
const MINTER_ID = QuestWorkItemIdStub({ value: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479' });
const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';

const UNIT_A = 'send-flow:observable:unit-a';
const UNIT_B = 'send-flow:observable:unit-b';
const UNIT_C = 'send-flow:observable:unit-c';

const FLOW = FlowStub({
  id: 'send-flow' as never,
  nodes: [
    FlowNodeStub({
      id: 'compose' as never,
      packages: ['web'] as never,
      observables: [
        FlowObservableStub({ id: 'unit-a' as never, description: 'unit a holds' as never }),
        FlowObservableStub({ id: 'unit-b' as never, description: 'unit b holds' as never }),
        FlowObservableStub({ id: 'unit-c' as never, description: 'unit c holds' as never }),
      ],
    }),
  ],
  edges: [],
});

const OPERATION_ITEM = OperationItemStub({
  id: OPERATION_ITEM_ID as never,
  role: 'codeweaver',
  text: 'build the send flow — package: web · flow: send-flow' as never,
  flowIds: ['send-flow'] as never,
  packageNames: [],
});

const WORK_ITEM = WorkItemStub({
  id: WORK_ITEM_ID,
  role: 'codeweaver',
  step: 'work' as never,
  pieceId: 'pc-badge' as never,
  relatedDataItems: [`operations/${OPERATION_ITEM_ID}`] as never,
  // THE ROUTER'S DECISION: the piece claims three units and the router filtered this session to two.
  assignedUnitIds: [UNIT_B, UNIT_C] as never,
});

const QUEST = QuestStub({
  id: QUEST_ID,
  worktreePath: '/home/testuser/worktrees/add-auth' as never,
  flows: [FLOW],
  operations: [OPERATION_ITEM],
  workItems: [WORK_ITEM],
});

// The piece the planner cut — its `assignedUnitIds` is INTENT and holds all three.
const PLAN = WorkPlanStub({
  operationItemId: OPERATION_ITEM_ID as never,
  batches: [
    WorkPlanBatchStub({
      pieces: [
        WorkPlanPieceStub({
          id: 'pc-badge' as never,
          step: 'work' as never,
          assignedUnitIds: [UNIT_A, UNIT_B, UNIT_C] as never,
          contextUnitIds: [],
          payload: WorkPlanPayloadCodeweaverStub({
            units: [UNIT_A, UNIT_B, UNIT_C].map((unitId) => ({
              unitId,
              kind: 'observable',
              observableType: 'ui-state',
              text: `${unitId} holds`,
              assert: 'render the widget and read the value back',
              failsIf: 'the value is the queued one rather than the persisted one',
            })) as never,
          }),
        }),
      ],
    }),
  ],
});

describe('questGetQuestWorkBroker', () => {
  describe('assignedUnits follows the WORK ITEM, never the piece', () => {
    it('VALID: {piece claims a,b,c and the router assigned b,c} => exactly b and c come back', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithPlan({
        quest: QUEST,
        operationItemId: OPERATION_ITEM_ID as never,
        plan: PLAN,
      });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.assignedUnits.map((unit) => String(unit.unitId))).toStrictEqual([UNIT_B, UNIT_C]);
    });

    // A `work` step declares no scope in `stepScopeStatics`, so its denominator is the item's WHOLE
    // enumerated set — every terminal, every observable and every off-map family on the flow. That
    // is the documented `undefined`-means-no-filter case, not a lookup miss.
    it('VALID: {the same fixture} => inScopeUnits holds the item’s whole enumerated set', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithPlan({
        quest: QUEST,
        operationItemId: OPERATION_ITEM_ID as never,
        plan: PLAN,
      });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.inScopeUnits.map((unit) => String(unit.unitId))).toStrictEqual([
        'send-flow:terminal:compose',
        UNIT_A,
        UNIT_B,
        UNIT_C,
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        'send-flow:off-map:hostile-input',
        'send-flow:off-map:perf',
      ]);
    });
  });

  describe('identity and scope', () => {
    it('VALID: {a codeweaver work step} => family, step and role all come off the family graph', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({ family: view.family, step: view.step, role: view.role }).toStrictEqual({
        family: 'codeweaver',
        step: 'work',
        role: 'worker',
      });
    });

    it('VALID: {an operation item naming one flow} => scope carries all four fields', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.scope).toStrictEqual({
        flowId: 'send-flow',
        packageNames: [],
        operationItemId: OPERATION_ITEM_ID,
        operationItemText: 'build the send flow — package: web · flow: send-flow',
      });
    });

    it('VALID: {an operation item naming no flow} => scope.flowId is null, not absent and not empty', async () => {
      const quest = QuestStub({
        ...QUEST,
        operations: [OperationItemStub({ ...OPERATION_ITEM, flowIds: [] })],
      });
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.scope.flowId).toBe(null);
    });
  });

  describe('the piece', () => {
    it('VALID: {a plan holding this work item’s piece} => the brief comes back whole', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithPlan({
        quest: QUEST,
        operationItemId: OPERATION_ITEM_ID as never,
        plan: PLAN,
      });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({
        pieceId: view.piece?.pieceId,
        step: view.piece?.step,
        recipeId: view.piece?.recipeId,
        baselineFor: view.piece?.baselineFor,
      }).toStrictEqual({
        pieceId: 'pc-badge',
        step: 'work',
        recipeId: null,
        baselineFor: null,
      });
    });

    it('VALID: {no plan on disk} => piece is EXPLICITLY null and the key survives', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect('piece' in view).toBe(true);
      expect(view.piece).toBe(null);
    });

    it('VALID: {a plan} => plannerNotes come off that piece’s own notes', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithPlan({
        quest: QUEST,
        operationItemId: OPERATION_ITEM_ID as never,
        plan: PLAN,
      });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.plannerNotes.map(String)).toStrictEqual([
        'the widget already exists — this piece only changes what it counts',
      ]);
    });
  });

  describe('mintingObservation', () => {
    it('VALID: {mintedBy names a work item holding an observation on an assigned unit} => that observation is served', async () => {
      const quest = QuestStub({
        ...QUEST,
        workItems: [
          WorkItemStub({
            id: MINTER_ID,
            relatedDataItems: [`operations/${OPERATION_ITEM_ID}`] as never,
            assignedUnitIds: [UNIT_B] as never,
            observations: [
              UnitObservationStub({
                unitId: UNIT_B as never,
                mark: 'unmet',
                evidence: 'the walker measured 1 where the flow says 2' as never,
              }),
            ],
          }),
          WorkItemStub({ ...WORK_ITEM, mintedBy: MINTER_ID }),
        ],
      });
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({
        unitId: view.mintingObservation?.unitId,
        mark: view.mintingObservation?.mark,
        evidence: view.mintingObservation?.evidence,
      }).toStrictEqual({
        unitId: UNIT_B,
        mark: 'unmet',
        evidence: 'the walker measured 1 where the flow says 2',
      });
    });

    it('VALID: {insertedBy set and mintedBy absent} => null, rather than following the retry-splice link', async () => {
      const quest = QuestStub({
        ...QUEST,
        workItems: [
          WorkItemStub({
            id: MINTER_ID,
            relatedDataItems: [`operations/${OPERATION_ITEM_ID}`] as never,
            assignedUnitIds: [UNIT_B] as never,
            observations: [
              UnitObservationStub({
                unitId: UNIT_B as never,
                mark: 'unmet',
                evidence: 'the ward run went red' as never,
              }),
            ],
          }),
          WorkItemStub({ ...WORK_ITEM, insertedBy: MINTER_ID }),
        ],
      });
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.mintingObservation).toBe(null);
    });
  });

  describe('the lane', () => {
    it('VALID: {a step that declares no needsLane} => instance is null, never absent', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect('instance' in view).toBe(true);
      expect(view.instance).toBe(null);
    });

    it('VALID: {the router recorded an instance on the payload} => it is served verbatim', async () => {
      const quest = QuestStub({
        ...QUEST,
        workItems: [
          WorkItemStub({
            ...WORK_ITEM,
            payload: {
              instance: {
                instanceId: 'inst_7f3a9c21',
                baseUrl: 'http://localhost:34173',
                apiUrl: 'http://localhost:34172',
                home: '/tmp/dm-siege-inst_7f3a9c21',
                logs: {
                  api: '/repo/.siegelense/instances/inst_7f3a9c21/api-server.log',
                  web: '/repo/.siegelense/instances/inst_7f3a9c21/web-server.log',
                },
              },
            },
          }),
        ],
      });
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.instance).toStrictEqual({
        instanceId: 'inst_7f3a9c21',
        baseUrl: 'http://localhost:34173',
        apiUrl: 'http://localhost:34172',
        home: '/tmp/dm-siege-inst_7f3a9c21',
        logs: {
          api: '/repo/.siegelense/instances/inst_7f3a9c21/api-server.log',
          web: '/repo/.siegelense/instances/inst_7f3a9c21/web-server.log',
        },
      });
    });

    it('VALID: {a browserless spec} => instance.baseUrl survives as null rather than being tightened', async () => {
      const quest = QuestStub({
        ...QUEST,
        workItems: [
          WorkItemStub({
            ...WORK_ITEM,
            payload: {
              instance: {
                instanceId: 'inst_7f3a9c21',
                baseUrl: null,
                apiUrl: 'http://localhost:34172',
                home: '/tmp/dm-siege-inst_7f3a9c21',
                logs: {
                  api: '/repo/.siegelense/instances/inst_7f3a9c21/api-server.log',
                  web: '/repo/.siegelense/instances/inst_7f3a9c21/web-server.log',
                },
              },
            },
          }),
        ],
      });
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.instance?.baseUrl).toBe(null);
    });
  });

  describe('the git rows', () => {
    it('VALID: {a quest whose recorded worktree is gone} => uncommittedPaths is empty, not a throw', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect({
        uncommittedPaths: view.uncommittedPaths,
        committedPaths: view.committedPaths,
      }).toStrictEqual({ uncommittedPaths: [], committedPaths: [] });
    });

    it('VALID: {a quest carrying a recorded worktree} => git echoes what the record holds', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.git).toStrictEqual({
        baseBranch: null,
        worktreePath: '/home/testuser/worktrees/add-auth',
        baseRef: null,
      });
    });
  });

  describe('session notes', () => {
    it('VALID: {a note on this scope’s flow and one on another} => only the matching note is served', async () => {
      const quest = QuestStub({
        ...QUEST,
        planningNotes: {
          blightLedger: [],
          operationPlans: [],
          questNotes: [
            QuestNoteStub({
              id: 'open-question-mine' as never,
              flowId: 'send-flow' as never,
              unitId: UNIT_B as never,
            }),
            QuestNoteStub({
              id: 'open-question-elsewhere' as never,
              flowId: 'other-flow' as never,
              unitId: 'other-flow:observable:elsewhere' as never,
            }),
          ],
        },
      });
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest, operationItemId: OPERATION_ITEM_ID as never });

      const view = await questGetQuestWorkBroker({
        questId: QUEST_ID,
        workItemId: WORK_ITEM_ID,
      });

      expect(view.sessionNotes.map((note) => String(note.id))).toStrictEqual([
        'open-question-mine',
      ]);
    });
  });

  describe('refusals', () => {
    it('ERROR: {a workItemId not on the quest} => throws naming the work item and the quest', async () => {
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest: QUEST, operationItemId: OPERATION_ITEM_ID as never });

      await expect(
        questGetQuestWorkBroker({
          questId: QUEST_ID,
          workItemId: QuestWorkItemIdStub({ value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479' }),
        }),
      ).rejects.toThrow(
        /get-quest-work: work item c3d4e5f6-58cc-4372-a567-0e02b2c3d479 is not on quest add-auth/u,
      );
    });

    it('ERROR: {a work item with no operations ref} => throws saying it declares no scope', async () => {
      const quest = QuestStub({
        ...QUEST,
        workItems: [WorkItemStub({ ...WORK_ITEM, relatedDataItems: [] })],
      });
      const proxy = questGetQuestWorkBrokerProxy();
      proxy.setupQuestWithNoPlan({ quest, operationItemId: OPERATION_ITEM_ID as never });

      await expect(
        questGetQuestWorkBroker({ questId: QUEST_ID, workItemId: WORK_ITEM_ID }),
      ).rejects.toThrow(/has no linked operation item on quest add-auth/u);
    });
  });
});
