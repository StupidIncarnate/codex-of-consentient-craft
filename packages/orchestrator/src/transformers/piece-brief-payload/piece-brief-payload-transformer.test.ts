import { UnitIdStub } from '@dungeonmaster/shared/contracts';

import { WorkPlanPayloadSiegemasterStub } from '../../contracts/work-plan-payload-siegemaster/work-plan-payload-siegemaster.stub';
import { WorkPlanPieceStub } from '../../contracts/work-plan-piece/work-plan-piece.stub';
import { pieceBriefPayloadTransformer } from './piece-brief-payload-transformer';

const KEPT_UNIT_ID = UnitIdStub({ value: 'send-flow:observable:check-badge-count-text' });
const DROPPED_UNIT_ID = UnitIdStub({ value: 'send-flow:observable:check-queue-drains' });

describe('pieceBriefPayloadTransformer', () => {
  describe('a family whose payload HAS a units array', () => {
    it('VALID: {two units in payload, one re-minted} => keeps only the re-minted entry, with its own fields', () => {
      const piece = WorkPlanPieceStub({
        assignedUnitIds: [KEPT_UNIT_ID, DROPPED_UNIT_ID],
        payload: {
          files: [],
          facts: ['the badge reads off the persisted list'],
          fences: [],
          traps: [],
          doNotTouch: [],
          units: [
            { unitId: KEPT_UNIT_ID, layer: 'browser', assert: 'the badge reads 2' },
            { unitId: DROPPED_UNIT_ID, layer: 'below-browser', assert: 'the queue empties' },
          ],
        },
      });

      const payload = pieceBriefPayloadTransformer({ piece, unitIds: [KEPT_UNIT_ID] });

      expect(payload).toStrictEqual({
        files: [],
        facts: ['the badge reads off the persisted list'],
        fences: [],
        traps: [],
        doNotTouch: [],
        units: [{ unitId: KEPT_UNIT_ID, layer: 'browser', assert: 'the badge reads 2' }],
      });
    });
  });

  describe('a family whose payload has NO units array', () => {
    it('VALID: {siegemaster payload} => copies { path, offMapFamily } whole and adds no units key', () => {
      const piece = WorkPlanPieceStub({
        assignedUnitIds: [KEPT_UNIT_ID],
        payload: WorkPlanPayloadSiegemasterStub({
          path: { nodeIds: ['queue-has-entries', 'batch-sent'], branchLabels: [] },
          offMapFamily: 'hostile-input',
        }),
      });

      const payload = pieceBriefPayloadTransformer({ piece, unitIds: [KEPT_UNIT_ID] });

      expect(payload).toStrictEqual({
        path: {
          nodeIds: ['queue-has-entries', 'batch-sent'],
          branchLabels: [],
          exitsFlow: false,
        },
        offMapFamily: 'hostile-input',
      });
    });
  });

  describe('the fields that never travel', () => {
    it('VALID: {payload carrying instanceId and runId} => drops both, keeps the rest', () => {
      const piece = WorkPlanPieceStub({
        assignedUnitIds: [KEPT_UNIT_ID],
        payload: {
          files: [],
          units: [{ unitId: KEPT_UNIT_ID }],
          instanceId: 'siege-1',
          runId: 'run_3',
        },
      });

      const payload = pieceBriefPayloadTransformer({ piece, unitIds: [KEPT_UNIT_ID] });

      expect(payload).toStrictEqual({ files: [], units: [{ unitId: KEPT_UNIT_ID }] });
    });
  });

  describe('baselineFor', () => {
    it('VALID: {adversarial piece} => carries baselineFor onto the copied payload', () => {
      const piece = WorkPlanPieceStub({
        assignedUnitIds: [KEPT_UNIT_ID],
        baselineFor: 'pc-walk-1',
        payload: WorkPlanPayloadSiegemasterStub({
          path: { nodeIds: ['batch-sent'], branchLabels: [] },
          offMapFamily: 'perf',
        }),
      });

      const payload = pieceBriefPayloadTransformer({ piece, unitIds: [KEPT_UNIT_ID] });

      expect(payload).toStrictEqual({
        path: { nodeIds: ['batch-sent'], branchLabels: [], exitsFlow: false },
        offMapFamily: 'perf',
        baselineFor: 'pc-walk-1',
      });
    });

    it('EMPTY: {payload is not an object, baselineFor set} => returns baselineFor alone', () => {
      const piece = WorkPlanPieceStub({
        assignedUnitIds: [KEPT_UNIT_ID],
        baselineFor: 'pc-walk-1',
        payload: 'not-an-object',
      });

      const payload = pieceBriefPayloadTransformer({ piece, unitIds: [KEPT_UNIT_ID] });

      expect(payload).toStrictEqual({ baselineFor: 'pc-walk-1' });
    });
  });

  describe('no payload at all', () => {
    it('EMPTY: {payload is not an object, no baselineFor} => returns undefined', () => {
      const piece = WorkPlanPieceStub({
        assignedUnitIds: [KEPT_UNIT_ID],
        payload: 'not-an-object',
      });

      const payload = pieceBriefPayloadTransformer({ piece, unitIds: [KEPT_UNIT_ID] });

      expect(payload).toBe(undefined);
    });
  });
});
