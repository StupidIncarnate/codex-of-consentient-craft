import { UnitIdStub } from '@dungeonmaster/shared/contracts/unit-id/unit-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';
import { WorkPlanPieceStub } from '@dungeonmaster/shared/contracts/work-plan-piece/work-plan-piece.stub';

import { WorkPlanBatchStub } from '../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanCodeweaverUnitStub } from '../../contracts/work-plan-codeweaver-unit/work-plan-codeweaver-unit.stub';
import { WorkPlanPayloadCodeweaverStub } from '../../contracts/work-plan-payload-codeweaver/work-plan-payload-codeweaver.stub';
import { WorkPlanStub } from '../../contracts/work-plan/work-plan.stub';
import { pieceBriefPayloadTransformer } from '../piece-brief-payload/piece-brief-payload-transformer';
import { unmetBatchLayerTransformer } from './unmet-batch-layer-transformer';

const WARD_ITEM_ID = '11111111-1111-4111-8111-111111111111';
const REPAIR_ITEM_ID = '22222222-2222-4222-8222-222222222222';
const REVIEW_ITEM_ID = '33333333-3333-4333-8333-333333333333';
const OPERATION_ITEM_ID = 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479';
const RE_ENTRY = UnitIdStub({ value: 'send-flow:off-map:re-entry' });
const PERF = UnitIdStub({ value: 'send-flow:off-map:perf' });
const STALENESS = UnitIdStub({ value: 'send-flow:off-map:staleness' });

describe('unmetBatchLayerTransformer', () => {
  describe('units no piece claims', () => {
    it('VALID: {three unclaimed units on one holder} => ONE successor carrying all three, never one per unit', () => {
      const holder = WorkItemStub({
        id: REVIEW_ITEM_ID,
        role: 'codeweaver',
        status: 'complete',
        step: 'review',
        assignedUnitIds: [RE_ENTRY, PERF, STALENESS],
      });

      const batch = unmetBatchLayerTransformer({
        plan: null,
        unmetUnitIds: [RE_ENTRY, PERF, STALENESS],
        terminalStepItems: [holder],
        step: 'review',
        unmetTarget: 'work',
        itemRole: 'codeweaver',
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'work',
          role: 'codeweaver',
          assignedUnitIds: [RE_ENTRY, PERF, STALENESS],
          needsLane: false,
          mintedBy: REVIEW_ITEM_ID,
        },
      ]);
    });
  });

  describe('a step whose unmet routes back to itself', () => {
    it('VALID: {repair -> repair, holder minted by ward} => the successor names the WARD, so its return edge lands on the gate and not on another repair', () => {
      const holder = WorkItemStub({
        id: REPAIR_ITEM_ID,
        role: 'codeweaver',
        status: 'complete',
        step: 'repair',
        assignedUnitIds: [PERF],
        mintedBy: WARD_ITEM_ID,
      });

      const batch = unmetBatchLayerTransformer({
        plan: null,
        unmetUnitIds: [PERF],
        terminalStepItems: [holder],
        step: 'repair',
        unmetTarget: 'repair',
        itemRole: 'codeweaver',
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'repair',
          role: 'codeweaver',
          assignedUnitIds: [PERF],
          needsLane: false,
          mintedBy: WARD_ITEM_ID,
        },
      ]);
    });

    it('EDGE: {self-loop, holder carries no minter} => the successor names the holder itself', () => {
      const holder = WorkItemStub({
        id: REPAIR_ITEM_ID,
        role: 'codeweaver',
        status: 'complete',
        step: 'repair',
        assignedUnitIds: [PERF],
      });

      const batch = unmetBatchLayerTransformer({
        plan: null,
        unmetUnitIds: [PERF],
        terminalStepItems: [holder],
        step: 'repair',
        unmetTarget: 'repair',
        itemRole: 'codeweaver',
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'repair',
          role: 'codeweaver',
          assignedUnitIds: [PERF],
          needsLane: false,
          mintedBy: REPAIR_ITEM_ID,
        },
      ]);
    });

    it('VALID: {review -> work, holder minted by someone} => not a self-loop, so the successor names the holder', () => {
      const holder = WorkItemStub({
        id: REVIEW_ITEM_ID,
        role: 'codeweaver',
        status: 'complete',
        step: 'review',
        assignedUnitIds: [PERF],
        mintedBy: WARD_ITEM_ID,
      });

      const batch = unmetBatchLayerTransformer({
        plan: null,
        unmetUnitIds: [PERF],
        terminalStepItems: [holder],
        step: 'review',
        unmetTarget: 'work',
        itemRole: 'codeweaver',
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'work',
          role: 'codeweaver',
          assignedUnitIds: [PERF],
          needsLane: false,
          mintedBy: REVIEW_ITEM_ID,
        },
      ]);
    });
  });

  describe('units a plan piece claims', () => {
    it('VALID: {one claimed, one unclaimed} => one item for the piece with its brief, one for the unclaimed holder', () => {
      const holder = WorkItemStub({
        id: REVIEW_ITEM_ID,
        role: 'codeweaver',
        status: 'complete',
        step: 'review',
        assignedUnitIds: [PERF, STALENESS],
      });
      const piece = WorkPlanPieceStub({
        id: 'pc-1',
        step: 'work',
        assignedUnitIds: [PERF],
        contextUnitIds: [],
        payload: WorkPlanPayloadCodeweaverStub({
          units: [WorkPlanCodeweaverUnitStub({ unitId: PERF })],
        }),
      });
      const plan = WorkPlanStub({
        operationItemId: OPERATION_ITEM_ID,
        family: 'codeweaver',
        flowId: 'send-flow',
        batches: [WorkPlanBatchStub({ mode: 'parallel', pieces: [piece] })],
      });

      const batch = unmetBatchLayerTransformer({
        plan,
        unmetUnitIds: [PERF, STALENESS],
        terminalStepItems: [holder],
        step: 'review',
        unmetTarget: 'work',
        itemRole: 'codeweaver',
        needsLane: false,
      });

      expect(batch).toStrictEqual([
        {
          step: 'work',
          role: 'codeweaver',
          assignedUnitIds: [PERF],
          needsLane: false,
          payload: pieceBriefPayloadTransformer({ piece, unitIds: [PERF] }),
          mintedBy: REVIEW_ITEM_ID,
        },
        {
          step: 'work',
          role: 'codeweaver',
          assignedUnitIds: [STALENESS],
          needsLane: false,
          mintedBy: REVIEW_ITEM_ID,
        },
      ]);
    });
  });

  describe('no holder at all', () => {
    it('EMPTY: {no terminal items} => one item with no mintedBy', () => {
      const batch = unmetBatchLayerTransformer({
        plan: null,
        unmetUnitIds: [PERF],
        terminalStepItems: [],
        step: 'review',
        unmetTarget: 'work',
        itemRole: 'codeweaver',
        needsLane: true,
      });

      expect(batch).toStrictEqual([
        { step: 'work', role: 'codeweaver', assignedUnitIds: [PERF], needsLane: true },
      ]);
    });
  });
});
