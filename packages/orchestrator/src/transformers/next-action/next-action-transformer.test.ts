import {
  FlowNodeStub,
  FlowStub,
  OperationItemStub,
  QuestStub,
  QuestWorkItemIdStub,
  StepNameStub,
  UnitIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questFlowStatics } from '@dungeonmaster/shared/statics';

import { WorkPlanBatchStub } from '../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanPayloadSiegemasterStub } from '../../contracts/work-plan-payload-siegemaster/work-plan-payload-siegemaster.stub';
import { WorkPlanPieceStub } from '../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../contracts/work-plan/work-plan.stub';
import { agentFlowStatics } from '../../statics/agent-flow/agent-flow-statics';
import { nextActionTransformer } from './next-action-transformer';

const SIEGE_PACKAGE = 'web-app';
const PERF_UNIT_ID = UnitIdStub({ value: 'send-flow:off-map:perf' });
const HOSTILE_UNIT_ID = UnitIdStub({ value: 'send-flow:off-map:hostile-input' });
const STALENESS_UNIT_ID = UnitIdStub({ value: 'send-flow:off-map:staleness' });
const CONCURRENCY_UNIT_ID = UnitIdStub({ value: 'send-flow:off-map:concurrency' });

const SIEGE_FLOW = FlowStub({
  id: 'send-flow',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({ id: 'web-node', label: 'Web Node', packages: [SIEGE_PACKAGE], observables: [] }),
  ],
  edges: [],
});

const SIEGE_OPERATION_ITEM = OperationItemStub({
  id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
  role: 'siegemaster',
  flowIds: ['send-flow'],
  packageNames: [],
});
const { id: SIEGE_OPERATION_ITEM_ID } = SIEGE_OPERATION_ITEM;
const OPERATIONS_REF = `operations/${String(SIEGE_OPERATION_ITEM_ID)}`;

const HAPPY_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
const SECOND_WALK_ITEM_ID = QuestWorkItemIdStub({ value: 'd4e5f6a7-58cc-4372-a567-0e02b2c3d479' });
const FIX_WORK_ITEM_ID = QuestWorkItemIdStub({ value: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479' });
const WARD_ITEM_ID = QuestWorkItemIdStub({ value: 'e5f6a7b8-58cc-4372-a567-0e02b2c3d479' });
const REPAIR_ITEM_ID = QuestWorkItemIdStub({ value: 'a7b8c9d0-58cc-4372-a567-0e02b2c3d479' });

const WALK_PAYLOAD = WorkPlanPayloadSiegemasterStub({
  path: { nodeIds: ['web-node'], branchLabels: [] },
  offMapFamily: 'perf',
});
const SECOND_WALK_PAYLOAD = WorkPlanPayloadSiegemasterStub({
  path: { nodeIds: ['web-node'], branchLabels: [] },
  offMapFamily: 'staleness',
});

// Two pieces at `happyWalk`: the first is STARTED (the recorded work item carries its id), the
// second is not — which is what makes question 3 true in the four-question fixture.
const SIEGE_PLAN = WorkPlanStub({
  operationItemId: SIEGE_OPERATION_ITEM_ID,
  family: 'siegemaster',
  flowId: 'send-flow',
  batches: [
    WorkPlanBatchStub({
      mode: 'parallel',
      pieces: [
        WorkPlanPieceStub({
          id: 'pc-walk-1',
          step: 'happyWalk',
          assignedUnitIds: [PERF_UNIT_ID, HOSTILE_UNIT_ID],
          contextUnitIds: [],
          payload: WALK_PAYLOAD,
        }),
        WorkPlanPieceStub({
          id: 'pc-walk-2',
          step: 'happyWalk',
          assignedUnitIds: [STALENESS_UNIT_ID],
          contextUnitIds: [],
          payload: SECOND_WALK_PAYLOAD,
        }),
      ],
    }),
  ],
});

const UNMET_WALK_ITEM = WorkItemStub({
  id: HAPPY_WORK_ITEM_ID,
  role: 'siegemaster',
  status: 'complete',
  step: 'happyWalk',
  pieceId: 'pc-walk-1',
  relatedDataItems: [OPERATIONS_REF],
  assignedUnitIds: [PERF_UNIT_ID, HOSTILE_UNIT_ID],
  observations: [
    UnitObservationStub({ unitId: PERF_UNIT_ID, mark: 'unmet', evidence: 'p95 was 1.9s' }),
    UnitObservationStub({
      unitId: HOSTILE_UNIT_ID,
      mark: 'unmet',
      evidence: 'a 4MB body 500s instead of 400ing',
    }),
  ],
});

const MET_WALK_ITEM = WorkItemStub({
  id: HAPPY_WORK_ITEM_ID,
  role: 'siegemaster',
  status: 'complete',
  step: 'happyWalk',
  pieceId: 'pc-walk-1',
  relatedDataItems: [OPERATIONS_REF],
  assignedUnitIds: [PERF_UNIT_ID, HOSTILE_UNIT_ID],
  observations: [
    UnitObservationStub({ unitId: PERF_UNIT_ID, mark: 'met', evidence: 'p95 was 120ms' }),
    UnitObservationStub({
      unitId: HOSTILE_UNIT_ID,
      mark: 'met',
      evidence: 'a 4MB body 400s with a typed error',
    }),
  ],
});

const ADVERSARIAL_IN_SCOPE = [
  'send-flow:off-map:re-entry',
  'send-flow:off-map:concurrency',
  'send-flow:off-map:interruption',
  'send-flow:off-map:staleness',
  'send-flow:off-map:configuration',
  'send-flow:off-map:hostile-input',
  'send-flow:off-map:perf',
];

const HAPPY_WALK_IN_SCOPE = ['send-flow:terminal:web-node', ...ADVERSARIAL_IN_SCOPE];

// Deliberately MIXED statuses — terminal, failed, skipped and in_progress — so a visit count that
// filtered on status would read fewer than 40 and let the budget overrun.
const FIX_VISIT_STATUSES = ['complete', 'failed', 'skipped', 'in_progress'] as const;
const FORTY_FIX_VISITS = [...Array(40).keys()].map((index) =>
  WorkItemStub({
    id: `b2c3d4e5-58cc-4372-a567-0e02b2c3d4${String(index).padStart(2, '0')}`,
    role: 'siegemaster',
    status: index === 39 ? 'complete' : (FIX_VISIT_STATUSES[index % 4] ?? 'complete'),
    step: 'fixHappy',
    relatedDataItems: [OPERATIONS_REF],
    assignedUnitIds: index === 39 ? [PERF_UNIT_ID] : [],
    observations:
      index === 39
        ? [UnitObservationStub({ unitId: PERF_UNIT_ID, mark: 'unmet', evidence: 'still 1.9s' })]
        : [],
  }),
);

// Every route in every step graph, family-qualified. `as object` rather than a shape:
// `agentFlowStatics` is a union of six differently-keyed graphs, so `Object.entries` falls to its
// `{}` overload and hands back `any`. Narrowing to `object` is what keeps the walk DERIVED from the
// statics rather than a hand-listed table of families.
const ALL_ROUTES = Object.entries(agentFlowStatics).flatMap(([family, graph]) => {
  const stepKeys = new Set(Object.keys(graph.steps));

  return Object.entries(graph.steps as object).flatMap(([stepKey, node]) =>
    Object.entries(node.routes as object).map(([outcome, target]) => ({
      label: `${family}.${stepKey}.${outcome} -> ${String(target)}`,
      target: String(target),
      stepKeys,
    })),
  );
});

// A route naming something else lands here BY NAME, so a failure says which one rather than only
// that one exists.
const UNRESOLVED_ROUTES = ALL_ROUTES.filter(
  (route) =>
    !route.stepKeys.has(route.target) && route.target !== '@done' && route.target !== '@blocked',
).map((route) => route.label);

describe('nextActionTransformer', () => {
  describe('the four questions, in order', () => {
    it('VALID: {a request, two unmet units, an unstarted batch and a declared done route} => the request wins', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [UNMET_WALK_ITEM],
      });

      const action = nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
        request: {
          fromWorkItemId: HAPPY_WORK_ITEM_ID,
          step: StepNameStub({ value: 'recipe' }),
          reason: 'the seeds this walk needs do not exist yet',
        },
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'recipe',
        cause: 'request',
        batch: [
          {
            step: 'recipe',
            role: 'siegemaster',
            assignedUnitIds: [],
            payload: { reason: 'the seeds this walk needs do not exist yet' },
            mintedBy: HAPPY_WORK_ITEM_ID,
            needsLane: false,
          },
        ],
      });
    });

    it('VALID: {no request, two unmet units from ONE piece} => mints one fixer at routes.unmet', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [UNMET_WALK_ITEM],
      });

      const action = nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'fixHappy',
        cause: 'unmet',
        batch: [
          {
            step: 'fixHappy',
            role: 'siegemaster',
            assignedUnitIds: ['send-flow:off-map:perf', 'send-flow:off-map:hostile-input'],
            payload: WALK_PAYLOAD,
            mintedBy: HAPPY_WORK_ITEM_ID,
            needsLane: false,
          },
        ],
      });
    });

    it('VALID: {no request, nothing unmet, an unstarted batch} => mints the unstarted piece here', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [MET_WALK_ITEM],
      });

      const action = nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'happyWalk',
        cause: 'plan-batch',
        batch: [
          {
            step: 'happyWalk',
            role: 'siegemaster',
            assignedUnitIds: ['send-flow:off-map:staleness'],
            pieceId: 'pc-walk-2',
            payload: SECOND_WALK_PAYLOAD,
            needsLane: true,
          },
        ],
      });
    });

    it('VALID: {no request, nothing unmet, every piece started} => follows routes.done', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [MET_WALK_ITEM],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'route',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        from: 'happyWalk',
        outcome: 'done',
        step: 'adversarial',
        batch: [
          {
            step: 'adversarial',
            role: 'siegemaster',
            assignedUnitIds: ADVERSARIAL_IN_SCOPE,
            needsLane: true,
          },
        ],
      });
    });
  });

  describe('every route in every step graph', () => {
    it('VALID: {all six graphs} => every route target is a step key, @done or @blocked', () => {
      // The walked count rides along so the sweep cannot pass by walking nothing. It moves with
      // the graph, exactly as `agent-flow-statics.test.ts`'s own full-value pin does.
      expect({ walked: ALL_ROUTES.length, unresolved: UNRESOLVED_ROUTES }).toStrictEqual({
        walked: 91,
        unresolved: [],
      });
    });
  });

  describe('the phase rule', () => {
    it('VALID: {one happyWalk piece terminal, one in_progress} => mints no adversarial item', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          MET_WALK_ITEM,
          WorkItemStub({
            id: SECOND_WALK_ITEM_ID,
            role: 'siegemaster',
            status: 'in_progress',
            step: 'happyWalk',
            pieceId: 'pc-walk-2',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [STALENESS_UNIT_ID],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'happyWalk',
        cause: 'capped',
        batch: [],
      });
    });

    it('VALID: {both happyWalk pieces terminal} => routes to adversarial', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          MET_WALK_ITEM,
          WorkItemStub({
            id: SECOND_WALK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            pieceId: 'pc-walk-2',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [STALENESS_UNIT_ID],
            observations: [
              UnitObservationStub({
                unitId: STALENESS_UNIT_ID,
                mark: 'met',
                evidence: 'the stale read refreshed',
              }),
            ],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'route',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        from: 'happyWalk',
        outcome: 'done',
        step: 'adversarial',
        batch: [
          {
            step: 'adversarial',
            role: 'siegemaster',
            assignedUnitIds: ADVERSARIAL_IN_SCOPE,
            needsLane: true,
          },
        ],
      });
    });
  });

  describe('the return edge', () => {
    it('VALID: {fixHappy done, routes.done undeclared, mintedBy set} => mints fresh at the minter step', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          MET_WALK_ITEM,
          WorkItemStub({
            id: FIX_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'fixHappy',
            mintedBy: HAPPY_WORK_ITEM_ID,
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [PERF_UNIT_ID],
            observations: [
              UnitObservationStub({
                unitId: PERF_UNIT_ID,
                mark: 'met',
                evidence: 'the N+1 read is gone',
              }),
            ],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'happyWalk',
        cause: 'return-to-minter',
        batch: [
          {
            step: 'happyWalk',
            role: 'siegemaster',
            assignedUnitIds: HAPPY_WALK_IN_SCOPE,
            needsLane: true,
          },
        ],
      });
    });

    it('INVALID: {fixHappy done, routes.done undeclared, no mintedBy} => blocks with no-minter', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: FIX_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'fixHappy',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [PERF_UNIT_ID],
            observations: [
              UnitObservationStub({
                unitId: PERF_UNIT_ID,
                mark: 'met',
                evidence: 'the N+1 read is gone',
              }),
            ],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        step: 'fixHappy',
        reason: 'no-minter',
        message:
          'step `fixHappy` in family `siegemaster` folded to `done`, which it declares no route ' +
          'for, and the work item that recorded it names no minter to return to. An undeclared ' +
          'outcome returns to whoever minted the step; with neither a route nor a minter the ' +
          'scope has nowhere to go.',
      });
    });
  });

  describe('a plain route mint into a return-only target carries the return edge', () => {
    it('VALID: {ward drains unmet, repair declares no `done` route} => the route mint records `mintedBy` on the current ward item', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: WARD_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'ward',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
        declaredWord: 'unmet',
      });

      expect(action).toStrictEqual({
        kind: 'route',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        from: 'ward',
        outcome: 'unmet',
        step: 'repair',
        batch: [
          {
            step: 'repair',
            role: 'siegemaster',
            assignedUnitIds: [],
            mintedBy: WARD_ITEM_ID,
            needsLane: false,
          },
        ],
      });
    });

    it("VALID: {commit drains done, ward declares its own `done` route} => the route mint carries no `mintedBy` — the target's own route table is enough", () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: WARD_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'commit',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
        declaredWord: 'done',
      });

      expect(action).toStrictEqual({
        kind: 'route',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        from: 'commit',
        outcome: 'done',
        step: 'ward',
        batch: [{ step: 'ward', role: 'siegemaster', assignedUnitIds: [], needsLane: false }],
      });
    });

    it("VALID: {repair drains done (undeclared), mintedBy set by the earlier route mint} => mints a FRESH `ward` item at the minter's step", () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: WARD_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'ward',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [],
          }),
          WorkItemStub({
            id: REPAIR_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'repair',
            mintedBy: WARD_ITEM_ID,
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'ward',
        cause: 'return-to-minter',
        batch: [{ step: 'ward', role: 'siegemaster', assignedUnitIds: [], needsLane: false }],
      });
    });
  });

  describe('grouping by the originating piece', () => {
    it('VALID: {two unmet units from TWO pieces} => two minted items, in the plan piece order', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            pieceId: 'pc-walk-1',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [PERF_UNIT_ID, STALENESS_UNIT_ID],
            observations: [
              UnitObservationStub({ unitId: PERF_UNIT_ID, mark: 'unmet', evidence: 'p95 1.9s' }),
              UnitObservationStub({
                unitId: STALENESS_UNIT_ID,
                mark: 'unmet',
                evidence: 'the cached row never refreshed',
              }),
            ],
          }),
          WorkItemStub({
            id: SECOND_WALK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            pieceId: 'pc-walk-2',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [],
            observations: [],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'fixHappy',
        cause: 'unmet',
        batch: [
          {
            step: 'fixHappy',
            role: 'siegemaster',
            assignedUnitIds: ['send-flow:off-map:perf'],
            payload: WALK_PAYLOAD,
            mintedBy: HAPPY_WORK_ITEM_ID,
            needsLane: false,
          },
          {
            step: 'fixHappy',
            role: 'siegemaster',
            assignedUnitIds: ['send-flow:off-map:staleness'],
            payload: SECOND_WALK_PAYLOAD,
            mintedBy: HAPPY_WORK_ITEM_ID,
            needsLane: false,
          },
        ],
      });
    });

    it('VALID: {an unmet unit no piece claimed} => its own item, with no pieceId and no payload', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            pieceId: 'pc-walk-1',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [CONCURRENCY_UNIT_ID],
            observations: [
              UnitObservationStub({
                unitId: CONCURRENCY_UNIT_ID,
                mark: 'unmet',
                evidence: 'two writers raced and the second win was lost',
              }),
            ],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: 'fixHappy',
        cause: 'unmet',
        batch: [
          {
            step: 'fixHappy',
            role: 'siegemaster',
            assignedUnitIds: ['send-flow:off-map:concurrency'],
            mintedBy: HAPPY_WORK_ITEM_ID,
            needsLane: false,
          },
        ],
      });
    });
  });

  describe('maxVisits, spent', () => {
    it('INVALID: {40 fixHappy visits with mixed statuses, one unmet unit} => blocks with max-visits', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: FORTY_FIX_VISITS,
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        step: 'fixHappy',
        reason: 'max-visits',
        message:
          'maxVisits spent: step `fixHappy` in family `siegemaster` has been entered 40 times ' +
          `for operation item ${String(SIEGE_OPERATION_ITEM_ID)}, and its whole budget is 40 — ` +
          'the loop is not converging and another session would find the same thing. Still ' +
          'unmet: send-flow:off-map:perf.',
      });
    });
  });

  describe('an unknown step', () => {
    it('INVALID: {a work item at a step nobody declared} => blocks, naming the step and the family', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'a-step-nobody-declared',
            relatedDataItems: [OPERATIONS_REF],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        step: 'a-step-nobody-declared',
        reason: 'unknown-step',
        message:
          'step `a-step-nobody-declared` is not declared in family `siegemaster` — ' +
          `agentFlowStatics.siegemaster.steps holds: ${Object.keys(agentFlowStatics.siegemaster.steps).join(', ')}. ` +
          'The step-name contract is free-form so a quest.json naming a retired step still loads; ' +
          'dispatch is the only place it may fail.',
      });
    });
  });

  describe('an unknown route target', () => {
    it('INVALID: {a graph routing done to a step it does not declare} => blocks with the backstop message', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'plan',
            relatedDataItems: [OPERATIONS_REF],
          }),
        ],
      });

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics: {
          siegemaster: {
            entry: 'plan',
            steps: {
              plan: { role: 'planner', kind: 'prompt', maxVisits: 5, routes: { done: 'nowhere' } },
            },
          },
        },
        questFlowStatics,
        declaredWord: 'done',
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        step: 'plan',
        reason: 'unknown-route-target',
        message:
          'step `plan` in family `siegemaster` routes `done` to `nowhere`, which is neither a ' +
          'step in that family nor `@done` nor `@blocked`. The graph reachability check runs at ' +
          'lint and at load; this throw is its backstop.',
      });
    });
  });

  describe('an invalidation', () => {
    it('VALID: {a flow invalidated} => unions its units onto the next mint and edits nothing', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [PERF_UNIT_ID],
            observations: [
              UnitObservationStub({
                unitId: PERF_UNIT_ID,
                mark: 'met',
                evidence: 'the attack did not fall over',
              }),
            ],
          }),
        ],
      });
      const workItemsBefore = JSON.parse(JSON.stringify(quest.workItems)) as unknown;

      const action = nextActionTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
        invalidatedFlowIds: [SIEGE_FLOW.id],
      });

      expect(action).toStrictEqual({
        kind: 'route',
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        from: 'adversarial',
        outcome: 'done',
        step: 'commit',
        batch: [
          {
            step: 'commit',
            role: 'siegemaster',
            assignedUnitIds: ADVERSARIAL_IN_SCOPE,
            needsLane: false,
          },
        ],
      });
      expect(quest.workItems).toStrictEqual(workItemsBefore);
    });
  });

  describe('purity', () => {
    it('VALID: {any call} => leaves the quest and the plan byte-identical', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [UNMET_WALK_ITEM],
      });
      const questBefore = JSON.parse(JSON.stringify(quest)) as unknown;
      const planBefore = JSON.parse(JSON.stringify(SIEGE_PLAN)) as unknown;

      nextActionTransformer({
        quest,
        plan: SIEGE_PLAN,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        agentFlowStatics,
        questFlowStatics,
      });

      expect(quest).toStrictEqual(questBefore);
      expect(SIEGE_PLAN).toStrictEqual(planBefore);
    });
  });

  describe('an absent operation item', () => {
    it('ERROR: {an operationItemId the quest does not hold} => throws naming the quest and the id', () => {
      const quest = QuestStub({ flows: [SIEGE_FLOW], operations: [], workItems: [] });

      expect(() =>
        nextActionTransformer({
          quest,
          plan: null,
          operationItemId: SIEGE_OPERATION_ITEM_ID,
          agentFlowStatics,
          questFlowStatics,
        }),
      ).toThrow(
        `nextActionTransformer: quest 'add-auth' holds no operation item '${String(SIEGE_OPERATION_ITEM_ID)}'`,
      );
    });
  });
});
