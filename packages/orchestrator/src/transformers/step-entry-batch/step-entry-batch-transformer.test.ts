import {
  FlowNodeStub,
  FlowStub,
  OperationItemStub,
  QuestStub,
  StepNameStub,
  UnitIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanBatchStub } from '../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanPayloadSiegemasterStub } from '../../contracts/work-plan-payload-siegemaster/work-plan-payload-siegemaster.stub';
import { WorkPlanPieceStub } from '../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../contracts/work-plan/work-plan.stub';
import { stepEntryBatchTransformer } from './step-entry-batch-transformer';

const SIEGE_PACKAGE = 'web-app';
const PERF_UNIT_ID = UnitIdStub({ value: 'send-flow:off-map:perf' });
const HOSTILE_UNIT_ID = UnitIdStub({ value: 'send-flow:off-map:hostile-input' });

const SIEGE_FLOW = FlowStub({
  id: 'send-flow',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'web-node',
      label: 'Web Node',
      packages: [SIEGE_PACKAGE],
      observables: [],
    }),
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

const ADVERSARIAL_IN_SCOPE = [
  'send-flow:off-map:re-entry',
  'send-flow:off-map:concurrency',
  'send-flow:off-map:interruption',
  'send-flow:off-map:staleness',
  'send-flow:off-map:configuration',
  'send-flow:off-map:hostile-input',
  'send-flow:off-map:perf',
];

describe('stepEntryBatchTransformer', () => {
  describe('a planner step', () => {
    it('VALID: {stepRole: planner} => one item assigned nothing, with no piece', () => {
      const quest = QuestStub({ flows: [SIEGE_FLOW], operations: [SIEGE_OPERATION_ITEM] });

      const batch = stepEntryBatchTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'plan' }),
        itemRole: 'siegemaster',
        stepRole: 'planner',
        deterministic: false,
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        { step: 'plan', role: 'siegemaster', assignedUnitIds: [], needsLane: false },
      ]);
    });
  });

  describe('a deterministic step', () => {
    it('VALID: {deterministic: true, stepRole: reviewer} => one item assigned nothing', () => {
      const quest = QuestStub({ flows: [SIEGE_FLOW], operations: [SIEGE_OPERATION_ITEM] });

      const batch = stepEntryBatchTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'ward' }),
        itemRole: 'siegemaster',
        stepRole: 'reviewer',
        deterministic: true,
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        { step: 'ward', role: 'siegemaster', assignedUnitIds: [], needsLane: false },
      ]);
    });
  });

  describe('a reviewer step', () => {
    it('VALID: {stepRole: reviewer at adversarial} => one item assigned the whole in-scope set', () => {
      const quest = QuestStub({ flows: [SIEGE_FLOW], operations: [SIEGE_OPERATION_ITEM] });

      const batch = stepEntryBatchTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
        itemRole: 'siegemaster',
        stepRole: 'reviewer',
        deterministic: false,
        needsLane: true,
      });

      expect(batch).toStrictEqual([
        {
          step: 'adversarial',
          role: 'siegemaster',
          assignedUnitIds: ADVERSARIAL_IN_SCOPE,
          needsLane: true,
        },
      ]);
    });
  });

  describe('a reviewer step the planner cut pieces for', () => {
    it('VALID: {unstarted happyWalk piece} => mints the piece, not the whole in-scope set', () => {
      const quest = QuestStub({ flows: [SIEGE_FLOW], operations: [SIEGE_OPERATION_ITEM] });
      const plan = WorkPlanStub({
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
                assignedUnitIds: [PERF_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({
                  path: { nodeIds: ['web-node'], branchLabels: [] },
                  offMapFamily: 'perf',
                }),
              }),
            ],
          }),
        ],
      });

      const batch = stepEntryBatchTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'happyWalk' }),
        itemRole: 'siegemaster',
        stepRole: 'reviewer',
        deterministic: false,
        needsLane: true,
      });

      expect(batch).toStrictEqual([
        {
          step: 'happyWalk',
          role: 'siegemaster',
          assignedUnitIds: ['send-flow:off-map:perf'],
          pieceId: 'pc-walk-1',
          payload: {
            path: { nodeIds: ['web-node'], branchLabels: [], exitsFlow: false },
            offMapFamily: 'perf',
            pieceName: 'comment count badge',
          },
          needsLane: true,
        },
      ]);
    });
  });

  describe('a worker step with an unstarted plan batch', () => {
    it('VALID: {two unstarted pieces at this step} => one item per piece, in plan order', () => {
      const quest = QuestStub({ flows: [SIEGE_FLOW], operations: [SIEGE_OPERATION_ITEM] });
      const plan = WorkPlanStub({
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        flowId: 'send-flow',
        batches: [
          WorkPlanBatchStub({
            mode: 'parallel',
            pieces: [
              WorkPlanPieceStub({
                id: 'pc-fix-1',
                step: 'fixHappy',
                assignedUnitIds: [PERF_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({
                  path: { nodeIds: ['web-node'], branchLabels: [] },
                  offMapFamily: 'perf',
                }),
              }),
              WorkPlanPieceStub({
                id: 'pc-fix-2',
                step: 'fixHappy',
                assignedUnitIds: [HOSTILE_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({
                  path: { nodeIds: ['web-node'], branchLabels: [] },
                  offMapFamily: 'hostile-input',
                }),
              }),
            ],
          }),
        ],
      });

      const batch = stepEntryBatchTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'fixHappy' }),
        itemRole: 'siegemaster',
        stepRole: 'worker',
        deterministic: false,
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'fixHappy',
          role: 'siegemaster',
          assignedUnitIds: ['send-flow:off-map:perf'],
          pieceId: 'pc-fix-1',
          payload: {
            path: { nodeIds: ['web-node'], branchLabels: [], exitsFlow: false },
            offMapFamily: 'perf',
            pieceName: 'comment count badge',
          },
          needsLane: false,
        },
        {
          step: 'fixHappy',
          role: 'siegemaster',
          assignedUnitIds: ['send-flow:off-map:hostile-input'],
          pieceId: 'pc-fix-2',
          payload: {
            path: { nodeIds: ['web-node'], branchLabels: [], exitsFlow: false },
            offMapFamily: 'hostile-input',
            pieceName: 'comment count badge',
          },
          needsLane: false,
        },
      ]);
    });

    it("VALID: {a piece's unit is already met} => re-filters the piece's intent against the record", () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [HOSTILE_UNIT_ID],
            observations: [
              UnitObservationStub({
                unitId: HOSTILE_UNIT_ID,
                mark: 'met',
                evidence: 'the walk drove it and it held',
              }),
            ],
          }),
        ],
      });
      const plan = WorkPlanStub({
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        flowId: 'send-flow',
        batches: [
          WorkPlanBatchStub({
            mode: 'parallel',
            pieces: [
              WorkPlanPieceStub({
                id: 'pc-fix-1',
                step: 'fixHappy',
                assignedUnitIds: [PERF_UNIT_ID, HOSTILE_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({
                  path: { nodeIds: ['web-node'], branchLabels: [] },
                  offMapFamily: 'perf',
                }),
              }),
            ],
          }),
        ],
      });

      const batch = stepEntryBatchTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'fixHappy' }),
        itemRole: 'siegemaster',
        stepRole: 'worker',
        deterministic: false,
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'fixHappy',
          role: 'siegemaster',
          assignedUnitIds: ['send-flow:off-map:perf'],
          pieceId: 'pc-fix-1',
          payload: {
            path: { nodeIds: ['web-node'], branchLabels: [], exitsFlow: false },
            offMapFamily: 'perf',
            pieceName: 'comment count badge',
          },
          needsLane: false,
        },
      ]);
    });
  });

  describe('a worker step with nothing unstarted', () => {
    it('VALID: {every piece at this step already started} => one item assigned the outstanding units', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            role: 'siegemaster',
            status: 'complete',
            step: 'fixHappy',
            pieceId: 'pc-fix-1',
            relatedDataItems: [OPERATIONS_REF],
            assignedUnitIds: [PERF_UNIT_ID],
            observations: [
              UnitObservationStub({
                unitId: PERF_UNIT_ID,
                mark: 'met',
                evidence: 'fixed and re-measured',
              }),
            ],
          }),
        ],
      });
      const plan = WorkPlanStub({
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        flowId: 'send-flow',
        batches: [
          WorkPlanBatchStub({
            mode: 'parallel',
            pieces: [
              WorkPlanPieceStub({
                id: 'pc-fix-1',
                step: 'fixHappy',
                assignedUnitIds: [PERF_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({
                  path: { nodeIds: ['web-node'], branchLabels: [] },
                  offMapFamily: 'perf',
                }),
              }),
            ],
          }),
        ],
      });

      const batch = stepEntryBatchTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
        itemRole: 'siegemaster',
        stepRole: 'worker',
        deterministic: false,
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'adversarial',
          role: 'siegemaster',
          assignedUnitIds: [
            'send-flow:off-map:re-entry',
            'send-flow:off-map:concurrency',
            'send-flow:off-map:interruption',
            'send-flow:off-map:staleness',
            'send-flow:off-map:configuration',
            'send-flow:off-map:hostile-input',
          ],
          needsLane: false,
        },
      ]);
    });
  });

  describe('a worker step on a scope whose planner has not run', () => {
    it('EMPTY: {plan: null} => one item assigned nothing', () => {
      const quest = QuestStub({ flows: [SIEGE_FLOW], operations: [SIEGE_OPERATION_ITEM] });

      const batch = stepEntryBatchTransformer({
        quest,
        plan: null,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'fixHappy' }),
        itemRole: 'siegemaster',
        stepRole: 'worker',
        deterministic: false,
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        { step: 'fixHappy', role: 'siegemaster', assignedUnitIds: [], needsLane: false },
      ]);
    });
  });
});
