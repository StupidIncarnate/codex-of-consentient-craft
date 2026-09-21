import { workPlanCodeweaverUnitContract } from './work-plan-codeweaver-unit-contract';
import { WorkPlanCodeweaverUnitStub } from './work-plan-codeweaver-unit.stub';

const CODEWEAVER_KINDS = workPlanCodeweaverUnitContract.shape.kind.options;

describe('workPlanCodeweaverUnitContract', () => {
  describe('valid units', () => {
    it('VALID: {no overrides} => parses an observable unit', () => {
      expect(WorkPlanCodeweaverUnitStub()).toStrictEqual({
        unitId: 'send-flow:observable:check-badge-count-text',
        kind: 'observable',
        observableType: 'ui-state',
        text: 'COMMENT_COUNT_BADGE reads 2 on a box carrying two persisted comments',
        assert: 'render the widget with two persisted comments and read the badge text',
        failsIf: 'the badge reads 0 while two comments are persisted',
      });
    });

    it.each(CODEWEAVER_KINDS)('VALID: {kind: %s} => parses', (kind) => {
      expect(WorkPlanCodeweaverUnitStub({ kind }).kind).toBe(kind);
    });

    it('VALID: {verifyByReading: true} => parses a read-check unit', () => {
      expect(WorkPlanCodeweaverUnitStub({ verifyByReading: true }).verifyByReading).toBe(true);
    });
  });

  describe('the kind enum is the checklist kinds minus off-map', () => {
    it('VALID: {options} => are exactly terminal, branch and observable', () => {
      expect(CODEWEAVER_KINDS).toStrictEqual(['terminal', 'branch', 'observable']);
    });

    it("INVALID: {kind: 'off-map'} => refused, since no unit test beside the code reaches a probe family", () => {
      expect(() => WorkPlanCodeweaverUnitStub({ kind: 'off-map' as never })).toThrow(
        /Invalid enum value/u,
      );
    });
  });

  describe('invalid units', () => {
    it('EMPTY: {empty object} => refused', () => {
      expect(workPlanCodeweaverUnitContract.safeParse({}).success).toBe(false);
    });

    it("INVALID: {unitId: 'obs-3'} => refused, since a unit id is <flowId>:<kind>:<localId>", () => {
      expect(() => WorkPlanCodeweaverUnitStub({ unitId: 'obs-3' })).toThrow(/Invalid/u);
    });

    it('EMPTY: {failsIf: empty string} => refused', () => {
      expect(() => WorkPlanCodeweaverUnitStub({ failsIf: '' })).toThrow(
        /String must contain at least 1 character/u,
      );
    });
  });
});
