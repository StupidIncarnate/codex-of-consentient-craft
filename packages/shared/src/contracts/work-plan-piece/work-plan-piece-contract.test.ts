import { workPlanPieceContract } from './work-plan-piece-contract';
import { WorkPlanPieceStub } from './work-plan-piece.stub';

describe('workPlanPieceContract', () => {
  describe('valid pieces', () => {
    it('VALID: {no overrides} => parses, carrying both unit lists and the payload untouched', () => {
      const piece = WorkPlanPieceStub();

      expect({
        id: piece.id,
        pieceName: piece.pieceName,
        step: piece.step,
        assignedUnitIds: piece.assignedUnitIds,
        contextUnitIds: piece.contextUnitIds,
        context: piece.context,
        notes: piece.notes,
        payload: piece.payload,
      }).toStrictEqual({
        id: 'pc-badge',
        pieceName: 'comment count badge',
        step: 'work',
        assignedUnitIds: ['send-flow:observable:check-badge-count-text'],
        contextUnitIds: ['send-flow:terminal:batch-sent'],
        context: 'the badge counts PERSISTED comments, never the queued ones',
        notes: ['the widget already exists — this piece only changes what it counts'],
        payload: {
          files: [
            {
              path: './packages/web/src/widgets/comment-badge/comment-badge-widget.tsx',
              change: 'new',
              in: '{ count: number }',
              out: 'ReactElement',
            },
            {
              path: './packages/web/src/widgets/comment-badge/comment-badge-widget.test.tsx',
              change: 'new',
              in: '{ count: number }',
              out: 'void',
              proves: ['send-flow:observable:check-badge-count-text'],
            },
          ],
          facts: ['COMMENT_COUNT_BADGE is already the testid every widget test filters on'],
          fences: ['this piece owns packages/web only'],
          traps: ['the badge counts PERSISTED comments, not queued ones'],
          doNotTouch: ['packages/server/src/responders/comment/batch'],
          units: [
            {
              unitId: 'send-flow:observable:check-badge-count-text',
              kind: 'observable',
              observableType: 'ui-state',
              text: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
              assert: 'render the widget with two persisted comments and read the badge text',
              failsIf: 'the badge reads 0 while two comments are persisted',
            },
          ],
        },
      });
    });

    it('EMPTY: {assignedUnitIds: []} => parses, since a contracts-only piece proves nothing itself', () => {
      expect(WorkPlanPieceStub({ assignedUnitIds: [] }).assignedUnitIds).toStrictEqual([]);
    });

    it('VALID: {no assignedUnitIds or contextUnitIds keys} => both default to empty', () => {
      const piece = workPlanPieceContract.parse({
        id: 'pc-contracts',
        pieceName: 'send-flow contracts',
        step: 'work',
        context: 'contracts only — nothing here is proved by this piece',
        payload: { files: [], units: [] },
      });

      expect({
        assignedUnitIds: piece.assignedUnitIds,
        contextUnitIds: piece.contextUnitIds,
        notes: piece.notes,
      }).toStrictEqual({ assignedUnitIds: [], contextUnitIds: [], notes: [] });
    });

    it('VALID: {recipeId and baselineFor} => both parse', () => {
      const piece = WorkPlanPieceStub({
        id: 'pc-attack',
        recipeId: 'session-with-nested-chain',
        baselineFor: 'pc-badge',
      });

      expect({ recipeId: piece.recipeId, baselineFor: piece.baselineFor }).toStrictEqual({
        recipeId: 'session-with-nested-chain',
        baselineFor: 'pc-badge',
      });
    });
  });

  describe('payload is unknown at this level', () => {
    it('VALID: {payload shaped for no family at all} => parses here, because the piece does not know its family', () => {
      expect(WorkPlanPieceStub({ payload: { nonsense: true } }).payload).toStrictEqual({
        nonsense: true,
      });
    });
  });

  describe('invalid pieces', () => {
    it('EMPTY: {empty object} => refused, since id, pieceName, step and context carry no defaults', () => {
      expect(workPlanPieceContract.safeParse({}).success).toBe(false);
    });

    it('EMPTY: {id: empty string} => refused', () => {
      expect(() => WorkPlanPieceStub({ id: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('EMPTY: {context: empty string} => refused', () => {
      expect(() => WorkPlanPieceStub({ context: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('EMPTY: {pieceName: empty string} => refused, since a plan file with no name re-authors rather than falls back', () => {
      expect(() => WorkPlanPieceStub({ pieceName: '' })).toThrow(
        /expected string to have >=1 characters/u,
      );
    });

    it('EMPTY: {no pieceName key} => refused, the same as a missing id or step', () => {
      const piece = { ...WorkPlanPieceStub() };
      Reflect.deleteProperty(piece, 'pieceName');

      expect(workPlanPieceContract.safeParse(piece).success).toBe(false);
    });

    it("INVALID: {assignedUnitIds: ['obs-3']} => refused, since a unit id is <flowId>:<kind>:<localId>", () => {
      expect(() => WorkPlanPieceStub({ assignedUnitIds: ['obs-3'] })).toThrow(/Invalid/u);
    });

    it("INVALID: {contextUnitIds: ['offmap:hostile-input']} => refused, since off-map is hyphenated and flow-scoped", () => {
      expect(() => WorkPlanPieceStub({ contextUnitIds: ['offmap:hostile-input'] })).toThrow(
        /Invalid/u,
      );
    });

    it('INVALID: {recipeId: camelCase} => refused', () => {
      expect(() => WorkPlanPieceStub({ recipeId: 'sessionWithNestedChain' })).toThrow(/Invalid/u);
    });
  });
});
