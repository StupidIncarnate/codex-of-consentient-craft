import { OperationItemStub } from '@dungeonmaster/shared/contracts';

import { QuestWorkViewStub } from '../../contracts/quest-work-view/quest-work-view.stub';
import { WorkPlanBatchStub } from '../../contracts/work-plan-batch/work-plan-batch.stub';
import { WorkPlanPayloadCodeweaverStub } from '../../contracts/work-plan-payload-codeweaver/work-plan-payload-codeweaver.stub';
import { WorkPlanPieceStub } from '../../contracts/work-plan-piece/work-plan-piece.stub';
import { WorkPlanStub } from '../../contracts/work-plan/work-plan.stub';
import { workPlanToTextTransformer } from './work-plan-to-text-transformer';

const OPERATION_ITEM = OperationItemStub({
  text: 'build the send flow — package: web · flow: send-flow' as never,
});

const IN_SCOPE_UNITS = QuestWorkViewStub({
  inScopeUnits: [
    {
      unitId: 'send-flow:observable:check-badge-count-text',
      kind: 'observable',
      text: 'the badge reads 2 on a box carrying two persisted comments',
      surface: 'the rendered DOM',
      nodeId: 'render-badge',
      edgeId: null,
      observableType: 'ui-state',
      verifyByReading: false,
      mark: null,
      evidence: null,
      toSettle: null,
      markedBy: null,
      markedAt: null,
    },
    {
      unitId: 'send-flow:terminal:batch-sent',
      kind: 'terminal',
      text: 'the batch is sent',
      surface: 'the end state itself',
      nodeId: 'batch-sent',
      edgeId: null,
      observableType: null,
      verifyByReading: false,
      mark: 'met',
      evidence: 'packages/web/src/a.test.ts:12 — red when the guard returns true',
      toSettle: null,
      markedBy: 'b2c3d4e5-58cc-4372-a567-0e02b2c3d479',
      markedAt: '2026-01-01T00:00:00.000Z',
    },
  ] as never,
}).inScopeUnits;

describe('workPlanToTextTransformer', () => {
  describe('coverage', () => {
    it('VALID: {a unit no piece claims} => the rendered TEXT says so on that unit’s row', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub(),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const row = String(result)
        .split('\n')
        .find((line) => line.startsWith('| `send-flow:terminal:batch-sent`'));

      expect(row).toBe('| `send-flow:terminal:batch-sent` | met | — NO PIECE CLAIMS THIS UNIT — |');
    });

    it('VALID: {a unit one piece claims} => its row names that piece', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub(),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const row = String(result)
        .split('\n')
        .find((line) => line.startsWith('| `send-flow:observable:check-badge-count-text`'));

      expect(row).toBe(
        '| `send-flow:observable:check-badge-count-text` | outstanding | `pc-badge` |',
      );
    });

    it('VALID: {one of two units unclaimed} => the count line states it', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub(),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const line = String(result)
        .split('\n')
        .find((entry) => entry.endsWith('in-scope units are claimed by no piece.'));

      expect(line).toBe('1 of 2 in-scope units are claimed by no piece.');
    });

    it('VALID: {a unit the planner recorded as cant-meet} => its row says so rather than reading as a hole', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub({
          plannerMarks: [
            {
              unitId: 'send-flow:terminal:batch-sent',
              mark: 'cant-meet',
              evidence: 'no round reaches this terminal this pass',
              toSettle: 'drive the batch send by hand once the lane exists',
              at: '2026-01-01T00:00:00.000Z',
            },
          ] as never,
        }),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const row = String(result)
        .split('\n')
        .find((line) => line.startsWith('| `send-flow:terminal:batch-sent`'));

      expect(row).toBe(
        '| `send-flow:terminal:batch-sent` | met | planner recorded it as `cant-meet` |',
      );
    });
  });

  describe('ordering', () => {
    it('VALID: {two batches} => each gets a numbered heading naming its mode, in execution order', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub({
          batches: [
            WorkPlanBatchStub({ mode: 'sequential' }),
            WorkPlanBatchStub({
              mode: 'parallel',
              pieces: [WorkPlanPieceStub({ id: 'pc-second' as never })],
            }),
          ],
        }),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const headings = String(result)
        .split('\n')
        .filter((line) => line.startsWith('## Batch'));

      expect(headings).toStrictEqual(['## Batch 1 — sequential', '## Batch 2 — parallel']);
    });

    it('VALID: {a parallel batch} => the heading is followed by what parallel means for its pieces', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub(),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const lines = String(result).split('\n');
      const headingIndex = lines.indexOf('## Batch 1 — parallel');

      expect(lines[headingIndex + 1]).toBe(
        'Every piece below runs at the same time. Nothing here may depend on anything else here.',
      );
    });
  });

  describe('piece rows', () => {
    it('VALID: {a piece} => its heading names the piece and the step it runs', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub(),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const heading = String(result)
        .split('\n')
        .find((line) => line.startsWith('### '));

      expect(heading).toBe('### pc-badge — step `work`');
    });

    it('VALID: {a piece claiming a unit} => the unit row carries the mark and the verbatim text', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub(),
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const row = String(result)
        .split('\n')
        .find((line) => line.startsWith('- [outstanding]'));

      expect(row).toBe(
        '- [outstanding] `send-flow:observable:check-badge-count-text` — the badge reads 2 on a box carrying two persisted comments',
      );
    });

    it('VALID: {a piece claiming nothing} => it says so rather than rendering an empty list', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: WorkPlanStub({
          batches: [
            WorkPlanBatchStub({
              pieces: [
                WorkPlanPieceStub({
                  id: 'pc-contracts' as never,
                  assignedUnitIds: [],
                  payload: WorkPlanPayloadCodeweaverStub({ units: [] }),
                }),
              ],
            }),
          ],
        }),
        inScopeUnits: [],
      });

      const line = String(result)
        .split('\n')
        .find((entry) => entry.startsWith('Claims no unit'));

      expect(line).toBe('Claims no unit — a contracts-only piece proves nothing itself.');
    });
  });

  describe('no plan', () => {
    it('EMPTY: {plan: null} => renders the sentence saying so, never a blank document', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: null,
        inScopeUnits: IN_SCOPE_UNITS,
      });

      const line = String(result)
        .split('\n')
        .find((entry) => entry.startsWith('No planner has run'));

      expect(line).toBe(
        'No planner has run against this item yet, so there is no plan to review. That is a real',
      );
    });

    it('EMPTY: {plan: null} => the operation item id and text still head the document', () => {
      const result = workPlanToTextTransformer({
        operationItem: OPERATION_ITEM,
        plan: null,
        inScopeUnits: [],
      });

      const lines = String(result).split('\n');

      expect([lines[0], lines[2]]).toStrictEqual([
        '# Plan for operation item a1b2c3d4-58cc-4372-a567-0e02b2c3d479',
        'build the send flow — package: web · flow: send-flow',
      ]);
    });
  });
});
