import {
  OperationItemStub,
  QuestStub,
  StepNameStub,
  UnitIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { MintedWorkItemStub } from '../../contracts/minted-work-item/minted-work-item.stub';
import { mintNextActionTransformer } from './mint-next-action-transformer';

const OPERATION_ITEM = OperationItemStub({
  id: 'a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
  role: 'flowrider',
  flowIds: ['send-flow'],
  packageNames: [],
});
const { id: OPERATION_ITEM_ID } = OPERATION_ITEM;
const OPERATIONS_REF = `operations/${String(OPERATION_ITEM_ID)}`;
const WORK_STEP = StepNameStub({ value: 'work' });
const BADGE_UNIT_ID = UnitIdStub({ value: 'send-flow:observable:check-badge-count-text' });

// Deliberately MIXED statuses — terminal, failed and one in_progress — so a status filter on the
// visit count fails these tests instead of passing them.
const VISIT_STATUSES = ['complete', 'failed', 'skipped', 'in_progress'] as const;
const FORTY_VISITS = [...Array(40).keys()].map((index) =>
  WorkItemStub({
    id: `f47ac10b-58cc-4372-a567-0e02b2c3d4${String(index).padStart(2, '0')}`,
    role: 'flowrider',
    status: VISIT_STATUSES[index % VISIT_STATUSES.length] ?? 'complete',
    step: 'work',
    relatedDataItems: [OPERATIONS_REF],
  }),
);

const BROWSER_PIECE = MintedWorkItemStub({
  step: 'work',
  role: 'flowrider',
  assignedUnitIds: [BADGE_UNIT_ID],
  payload: { units: [{ unitId: BADGE_UNIT_ID, layer: 'browser' }] },
});
const BELOW_BROWSER_PIECES = [...Array(6).keys()].map((index) =>
  MintedWorkItemStub({
    step: 'work',
    role: 'flowrider',
    assignedUnitIds: [],
    pieceId: `pc-below-${String(index)}`,
    payload: { units: [{ unitId: BADGE_UNIT_ID, layer: 'below-browser' }] },
  }),
);

describe('mintNextActionTransformer', () => {
  describe('maxVisits', () => {
    it('INVALID: {40 work visits, batch of one, maxVisits 40} => blocks, naming the step, family and count', () => {
      const quest = QuestStub({ operations: [OPERATION_ITEM], workItems: FORTY_VISITS });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [MintedWorkItemStub({ step: 'work', role: 'flowrider' })],
        cause: 'unmet',
        maxVisits: 40,
        maxConcurrent: undefined,
        invalidatedUnitIds: [],
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: 'work',
        reason: 'max-visits',
        message:
          'maxVisits spent: step `work` in family `flowrider` has been entered 40 times for ' +
          `operation item ${String(OPERATION_ITEM_ID)}, and its whole budget is 40 — the loop is ` +
          'not converging and another session would find the same thing. Still unmet: ' +
          'send-flow:observable:check-badge-count-text.',
      });
    });

    it('INVALID: {39 work visits, batch of TWO, maxVisits 40} => blocks before minting either', () => {
      const quest = QuestStub({
        operations: [OPERATION_ITEM],
        workItems: FORTY_VISITS.slice(0, 39),
      });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [
          MintedWorkItemStub({ step: 'work', role: 'flowrider', pieceId: 'pc-a' }),
          MintedWorkItemStub({ step: 'work', role: 'flowrider', pieceId: 'pc-b' }),
        ],
        cause: 'plan-batch',
        maxVisits: 40,
        maxConcurrent: undefined,
        invalidatedUnitIds: [],
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: 'work',
        reason: 'max-visits',
        message:
          'maxVisits spent: step `work` in family `flowrider` has been entered 39 times for ' +
          `operation item ${String(OPERATION_ITEM_ID)}, and its whole budget is 40 — the loop is ` +
          'not converging and another session would find the same thing. Still unmet: ' +
          'send-flow:observable:check-badge-count-text.',
      });
    });

    it('VALID: {39 work visits, batch of ONE, maxVisits 40} => spends the last of the budget', () => {
      const quest = QuestStub({
        operations: [OPERATION_ITEM],
        workItems: FORTY_VISITS.slice(0, 39),
      });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [MintedWorkItemStub({ step: 'work', role: 'flowrider' })],
        cause: 'unmet',
        maxVisits: 40,
        maxConcurrent: undefined,
        invalidatedUnitIds: [],
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'unmet',
        batch: [
          {
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
            needsLane: false,
          },
        ],
      });
    });
  });

  describe('maxConcurrent', () => {
    it('VALID: {six below-browser pieces plus one browser piece, limit 4} => all seven mint', () => {
      const quest = QuestStub({ operations: [OPERATION_ITEM], workItems: [] });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [...BELOW_BROWSER_PIECES, BROWSER_PIECE],
        cause: 'plan-batch',
        maxVisits: 40,
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
        invalidatedUnitIds: [],
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'plan-batch',
        batch: [...BELOW_BROWSER_PIECES, BROWSER_PIECE],
      });
    });

    it('EDGE: {four browser walks in_progress, one browser piece, limit 4} => capped with an empty batch', () => {
      const quest = QuestStub({
        operations: [OPERATION_ITEM],
        workItems: [...Array(4).keys()].map((index) =>
          WorkItemStub({
            id: `f47ac10b-58cc-4372-a567-0e02b2c3d5${String(index).padStart(2, '0')}`,
            role: 'flowrider',
            status: 'in_progress',
            step: 'work',
            relatedDataItems: [OPERATIONS_REF],
            payload: { units: [{ unitId: BADGE_UNIT_ID, layer: 'browser' }] },
          }),
        ),
      });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [BROWSER_PIECE],
        cause: 'unmet',
        maxVisits: 40,
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
        invalidatedUnitIds: [],
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'capped',
        batch: [],
      });
    });

    it('EDGE: {three browser walks in_progress, two browser pieces, limit 4} => mints one and holds the other', () => {
      const quest = QuestStub({
        operations: [OPERATION_ITEM],
        workItems: [...Array(3).keys()].map((index) =>
          WorkItemStub({
            id: `f47ac10b-58cc-4372-a567-0e02b2c3d5${String(index).padStart(2, '0')}`,
            role: 'flowrider',
            status: 'in_progress',
            step: 'work',
            relatedDataItems: [OPERATIONS_REF],
            payload: { units: [{ unitId: BADGE_UNIT_ID, layer: 'browser' }] },
          }),
        ),
      });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [
          MintedWorkItemStub({
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: [BADGE_UNIT_ID],
            pieceId: 'pc-browser-1',
            payload: { units: [{ unitId: BADGE_UNIT_ID, layer: 'browser' }] },
          }),
          MintedWorkItemStub({
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: [BADGE_UNIT_ID],
            pieceId: 'pc-browser-2',
            payload: { units: [{ unitId: BADGE_UNIT_ID, layer: 'browser' }] },
          }),
        ],
        cause: 'plan-batch',
        maxVisits: 40,
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
        invalidatedUnitIds: [],
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'plan-batch',
        batch: [
          {
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
            pieceId: 'pc-browser-1',
            payload: {
              units: [{ unitId: 'send-flow:observable:check-badge-count-text', layer: 'browser' }],
            },
            needsLane: false,
          },
        ],
      });
    });
  });

  describe('a route', () => {
    it('VALID: {from and outcome given} => returns a route carrying both', () => {
      const quest = QuestStub({ operations: [OPERATION_ITEM], workItems: [] });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [MintedWorkItemStub({ step: 'work', role: 'flowrider', assignedUnitIds: [] })],
        cause: 'plan-batch',
        maxVisits: 40,
        maxConcurrent: undefined,
        invalidatedUnitIds: [],
        from: StepNameStub({ value: 'plan' }),
        outcome: 'done',
      });

      expect(action).toStrictEqual({
        kind: 'route',
        operationItemId: OPERATION_ITEM_ID,
        from: 'plan',
        outcome: 'done',
        step: 'work',
        batch: [{ step: 'work', role: 'flowrider', assignedUnitIds: [], needsLane: false }],
      });
    });
  });

  describe('an invalidation', () => {
    it('VALID: {two invalidated units, batch of two} => unions them onto the FIRST item only', () => {
      const quest = QuestStub({ operations: [OPERATION_ITEM], workItems: [] });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [
          MintedWorkItemStub({
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: [],
            pieceId: 'pc-a',
          }),
          MintedWorkItemStub({
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: [],
            pieceId: 'pc-b',
          }),
        ],
        cause: 'plan-batch',
        maxVisits: 40,
        maxConcurrent: undefined,
        invalidatedUnitIds: [
          UnitIdStub({ value: 'send-flow:terminal:batch-sent' }),
          UnitIdStub({ value: 'send-flow:branch:copy-failed' }),
        ],
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'work',
        cause: 'plan-batch',
        batch: [
          {
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: ['send-flow:terminal:batch-sent', 'send-flow:branch:copy-failed'],
            pieceId: 'pc-a',
            needsLane: false,
          },
          {
            step: 'work',
            role: 'flowrider',
            assignedUnitIds: [],
            pieceId: 'pc-b',
            needsLane: false,
          },
        ],
      });
    });
  });
});
