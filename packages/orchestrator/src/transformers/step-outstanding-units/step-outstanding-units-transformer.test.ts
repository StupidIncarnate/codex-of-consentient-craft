import {
  FlowNodeStub,
  FlowStub,
  OperationItemStub,
  QuestStub,
  StepNameStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { WorkPlanBatchStub } from '../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanPayloadSiegemasterStub } from '../../contracts/work-plan-payload-siegemaster/work-plan-payload-siegemaster.stub';
import { WorkPlanPieceStub } from '../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../contracts/work-plan/work-plan.stub';
import { stepOutstandingUnitsTransformer } from './step-outstanding-units-transformer';

const SIEGE_PACKAGE = 'web-app';
const PERF_UNIT_ID = 'send-flow:off-map:perf';
const HOSTILE_UNIT_ID = 'send-flow:off-map:hostile-input';

// One flow, one node. At `adversarial` the step scope is `unitKinds: ['off-map']`, so the in-scope
// set is exactly the seven `send-flow:off-map:<family>` units — no terminal or branch to read past.
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

const { id: HAPPY_WORK_ITEM_ID } = WorkItemStub({
  id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
});
const { id: ADVERSARIAL_WORK_ITEM_ID } = WorkItemStub({
  id: 'd4e5f6a7-58cc-4372-a567-0e02b2c3d479',
});
const { id: ABSENT_OPERATION_ITEM_ID } = OperationItemStub({
  id: 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479',
});

describe('stepOutstandingUnitsTransformer', () => {
  describe('the live-work-item qualifier', () => {
    it('VALID: {two walkers at once} => drops the unit the live happyWalk holds and keeps the unclaimed one', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'in_progress',
            step: 'happyWalk',
            pieceId: 'pc-happy-1',
            payload: { units: [{ unitId: PERF_UNIT_ID }] },
            observations: [],
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
                id: 'pc-happy-1',
                step: 'happyWalk',
                assignedUnitIds: [PERF_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'perf' }),
              }),
              WorkPlanPieceStub({
                id: 'pc-adv-1',
                step: 'adversarial',
                assignedUnitIds: [HOSTILE_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'hostile-input' }),
              }),
            ],
          }),
        ],
      });

      const result = stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
      ]);
    });

    it('VALID: {the same walker complete and marked unmet} => the unit it held comes back', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'happyWalk',
            pieceId: 'pc-happy-1',
            payload: { units: [{ unitId: PERF_UNIT_ID }] },
            observations: [
              UnitObservationStub({
                unitId: PERF_UNIT_ID,
                mark: 'unmet',
                evidence: 'the send queue held 4.1s under 200 queued comments',
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
                id: 'pc-happy-1',
                step: 'happyWalk',
                assignedUnitIds: [PERF_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'perf' }),
              }),
              WorkPlanPieceStub({
                id: 'pc-adv-1',
                step: 'adversarial',
                assignedUnitIds: [HOSTILE_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'hostile-input' }),
              }),
            ],
          }),
        ],
      });

      const result = stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        PERF_UNIT_ID,
      ]);
    });

    it('VALID: {a queued walker holds the unit} => the queued item counts as live', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'queued',
            step: 'happyWalk',
            payload: { units: [{ unitId: PERF_UNIT_ID }] },
            observations: [],
          }),
        ],
      });
      const plan = WorkPlanStub({
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        flowId: 'send-flow',
        batches: [],
      });

      const result = stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        HOSTILE_UNIT_ID,
      ]);
    });
  });

  describe('the unstarted-plan-piece qualifier', () => {
    it('VALID: {a piece claims the unit and no work item carries its pieceId} => the unit is not outstanding', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: ADVERSARIAL_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            observations: [],
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
                id: 'pc-adv-1',
                step: 'adversarial',
                assignedUnitIds: [HOSTILE_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'hostile-input' }),
              }),
            ],
          }),
        ],
      });

      const result = stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        PERF_UNIT_ID,
      ]);
    });

    it('VALID: {the same piece, now carried by a work item} => the unit is no longer shielded', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: ADVERSARIAL_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            pieceId: 'pc-adv-1',
            observations: [],
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
                id: 'pc-adv-1',
                step: 'adversarial',
                assignedUnitIds: [HOSTILE_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'hostile-input' }),
              }),
            ],
          }),
        ],
      });

      const result = stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        HOSTILE_UNIT_ID,
        PERF_UNIT_ID,
      ]);
    });
  });

  describe('the record qualifier', () => {
    it("VALID: {a complete work item marked 'met'} => the unit is not outstanding", () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: ADVERSARIAL_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            payload: { units: [{ unitId: HOSTILE_UNIT_ID }] },
            observations: [
              UnitObservationStub({
                unitId: HOSTILE_UNIT_ID,
                mark: 'met',
                evidence: 'a 2MB body returned 400 rather than crashing the responder',
              }),
            ],
          }),
        ],
      });
      const plan = WorkPlanStub({
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        flowId: 'send-flow',
        batches: [],
      });

      const result = stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        PERF_UNIT_ID,
      ]);
    });

    it("VALID: {a complete work item marked 'unmet'} => the unit is still outstanding", () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: ADVERSARIAL_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'complete',
            step: 'adversarial',
            payload: { units: [{ unitId: HOSTILE_UNIT_ID }] },
            observations: [
              UnitObservationStub({
                unitId: HOSTILE_UNIT_ID,
                mark: 'unmet',
                evidence: 'a 2MB body crashed the responder with an unhandled parse throw',
              }),
            ],
          }),
        ],
      });
      const plan = WorkPlanStub({
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        flowId: 'send-flow',
        batches: [],
      });

      const result = stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(result).toStrictEqual([
        'send-flow:off-map:re-entry',
        'send-flow:off-map:concurrency',
        'send-flow:off-map:interruption',
        'send-flow:off-map:staleness',
        'send-flow:off-map:configuration',
        HOSTILE_UNIT_ID,
        PERF_UNIT_ID,
      ]);
    });
  });

  describe('an operationItemId on no ledger', () => {
    it('ERROR: {unknown operationItemId} => throws naming the quest and the id', () => {
      const quest = QuestStub({
        id: 'send-batch',
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [],
      });
      const plan = WorkPlanStub({
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        family: 'siegemaster',
        flowId: 'send-flow',
        batches: [],
      });

      expect(() =>
        stepOutstandingUnitsTransformer({
          quest,
          plan,
          operationItemId: ABSENT_OPERATION_ITEM_ID,
          step: StepNameStub({ value: 'adversarial' }),
        }),
      ).toThrow(
        "stepOutstandingUnitsTransformer: quest 'send-batch' holds no operation item 'c3d4e5f6-58cc-4372-a567-0e02b2c3d479'",
      );
    });
  });

  describe('purity', () => {
    it('VALID: {any quest} => leaves the quest byte-identical', () => {
      const quest = QuestStub({
        flows: [SIEGE_FLOW],
        operations: [SIEGE_OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: HAPPY_WORK_ITEM_ID,
            role: 'siegemaster',
            status: 'in_progress',
            step: 'happyWalk',
            pieceId: 'pc-happy-1',
            payload: { units: [{ unitId: PERF_UNIT_ID }] },
            observations: [],
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
                id: 'pc-adv-1',
                step: 'adversarial',
                assignedUnitIds: [HOSTILE_UNIT_ID],
                contextUnitIds: [],
                payload: WorkPlanPayloadSiegemasterStub({ offMapFamily: 'hostile-input' }),
              }),
            ],
          }),
        ],
      });
      const before = JSON.stringify(quest);

      stepOutstandingUnitsTransformer({
        quest,
        plan,
        operationItemId: SIEGE_OPERATION_ITEM_ID,
        step: StepNameStub({ value: 'adversarial' }),
      });

      expect(JSON.stringify(quest)).toBe(before);
    });
  });
});
