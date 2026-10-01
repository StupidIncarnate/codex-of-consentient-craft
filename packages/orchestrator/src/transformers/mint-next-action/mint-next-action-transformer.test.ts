import { OperationItemStub } from '@dungeonmaster/shared/contracts/operation-item/operation-item.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { UnitIdStub } from '@dungeonmaster/shared/contracts/unit-id/unit-id.stub';
import { WorkItemStub } from '@dungeonmaster/shared/contracts/work-item/work-item.stub';

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
const WORK_STEP = 'work';
const BADGE_UNIT_ID = UnitIdStub({ value: 'send-flow:observable:check-badge-count-text' });
const REPAIR_ITEM_ID = 'a9b8c7d6-58cc-4372-a567-0e02b2c3d479';
const HEAD_SHA = '0123456789abcdef0123456789abcdef01234567';
const OTHER_SHA = 'fedcba9876543210fedcba9876543210fedcba98';

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
  describe('no visit budget', () => {
    it('VALID: {40 earlier work visits, batch of one} => mints — a step runs as many times as its work needs', () => {
      const quest = QuestStub({ operations: [OPERATION_ITEM], workItems: FORTY_VISITS });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: WORK_STEP,
        batch: [MintedWorkItemStub({ step: 'work', role: 'flowrider' })],
        cause: 'unmet',
        requiresProgress: false,
        headSha: undefined,
        maxConcurrent: undefined,
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

  describe('no progress on a repair loop', () => {
    it('INVALID: {requiresProgress, the last repair started at the current HEAD} => blocks no-progress, naming the repair and the sha', () => {
      const quest = QuestStub({
        operations: [OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: REPAIR_ITEM_ID,
            role: 'flowrider',
            status: 'complete',
            step: 'repair',
            startRef: HEAD_SHA,
            relatedDataItems: [OPERATIONS_REF],
          }),
        ],
      });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: 'repair',
        batch: [MintedWorkItemStub({ step: 'repair', role: 'flowrider', assignedUnitIds: [] })],
        cause: 'plan-batch',
        requiresProgress: true,
        headSha: HEAD_SHA,
        maxConcurrent: undefined,
      });

      expect(action).toStrictEqual({
        kind: 'block',
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: 'repair',
        reason: 'no-progress',
        message:
          'no progress: the last `repair` in family `flowrider` for operation item ' +
          `${String(OPERATION_ITEM_ID)} (work item ${REPAIR_ITEM_ID}) committed nothing — the ` +
          `worktree HEAD is still ${HEAD_SHA}, where it started — and its gate went red again. ` +
          'Another session would read the same failure, so the quest halts for a human.',
      });
    });

    it.each([
      [
        'HEAD moved past the last repair',
        { startRef: OTHER_SHA, headSha: HEAD_SHA, requiresProgress: true },
      ],
      ['HEAD unknown', { startRef: HEAD_SHA, headSha: undefined, requiresProgress: true }],
      [
        'the step needs no progress',
        { startRef: HEAD_SHA, headSha: HEAD_SHA, requiresProgress: false },
      ],
    ] as const)(
      'VALID: {%s} => mints the repair',
      (_label, { startRef, headSha, requiresProgress }) => {
        const quest = QuestStub({
          operations: [OPERATION_ITEM],
          workItems: [
            WorkItemStub({
              id: REPAIR_ITEM_ID,
              role: 'flowrider',
              status: 'complete',
              step: 'repair',
              startRef,
              relatedDataItems: [OPERATIONS_REF],
            }),
          ],
        });

        const action = mintNextActionTransformer({
          quest,
          operationItemId: OPERATION_ITEM_ID,
          family: 'flowrider',
          step: 'repair',
          batch: [MintedWorkItemStub({ step: 'repair', role: 'flowrider', assignedUnitIds: [] })],
          cause: 'plan-batch',
          requiresProgress,
          headSha,
          maxConcurrent: undefined,
        });

        expect(action).toStrictEqual({
          kind: 'mint',
          operationItemId: OPERATION_ITEM_ID,
          step: 'repair',
          cause: 'plan-batch',
          batch: [{ step: 'repair', role: 'flowrider', assignedUnitIds: [], needsLane: false }],
        });
      },
    );

    it('EDGE: {the last repair never fetched its prompt, so carries no startRef} => mints, never blocking on what it cannot measure', () => {
      const quest = QuestStub({
        operations: [OPERATION_ITEM],
        workItems: [
          WorkItemStub({
            id: REPAIR_ITEM_ID,
            role: 'flowrider',
            status: 'complete',
            step: 'repair',
            relatedDataItems: [OPERATIONS_REF],
          }),
        ],
      });

      const action = mintNextActionTransformer({
        quest,
        operationItemId: OPERATION_ITEM_ID,
        family: 'flowrider',
        step: 'repair',
        batch: [MintedWorkItemStub({ step: 'repair', role: 'flowrider', assignedUnitIds: [] })],
        cause: 'plan-batch',
        requiresProgress: true,
        headSha: HEAD_SHA,
        maxConcurrent: undefined,
      });

      expect(action).toStrictEqual({
        kind: 'mint',
        operationItemId: OPERATION_ITEM_ID,
        step: 'repair',
        cause: 'plan-batch',
        batch: [{ step: 'repair', role: 'flowrider', assignedUnitIds: [], needsLane: false }],
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
        requiresProgress: false,
        headSha: undefined,
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
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
        requiresProgress: false,
        headSha: undefined,
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
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
        requiresProgress: false,
        headSha: undefined,
        maxConcurrent: { limit: 4, counts: 'browser-pieces' },
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
        requiresProgress: false,
        headSha: undefined,
        maxConcurrent: undefined,
        from: 'plan',
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
});
