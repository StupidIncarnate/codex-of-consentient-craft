import { workPlanFlowriderUnitContract } from './work-plan-flowrider-unit-contract';
import { WorkPlanFlowriderUnitStub } from './work-plan-flowrider-unit.stub';

const FLOWRIDER_KINDS = workPlanFlowriderUnitContract.shape.kind.options;

describe('workPlanFlowriderUnitContract', () => {
  describe('valid units', () => {
    it('VALID: {no overrides} => parses a terminal unit with no surface key', () => {
      expect(WorkPlanFlowriderUnitStub()).toStrictEqual({
        unitId: 'send-flow:terminal:batch-sent',
        kind: 'terminal',
        layer: 'browser',
        observableTarget: { target: 'node', nodeId: 'batch-sent' },
        assert: 'the queue panel renders zero rows once the send resolves',
        failsIf: 'the panel still renders the sent rows',
      });
    });

    it('VALID: {layer: below-browser} => parses', () => {
      expect(WorkPlanFlowriderUnitStub({ layer: 'below-browser' }).layer).toBe('below-browser');
    });

    it('VALID: {observableTarget on an edge} => parses', () => {
      expect(
        WorkPlanFlowriderUnitStub({
          unitId: 'send-flow:branch:queue-has-entries',
          kind: 'branch',
          observableTarget: { target: 'edge', edgeId: 'queue-has-entries' },
        }).observableTarget,
      ).toStrictEqual({ target: 'edge', edgeId: 'queue-has-entries' });
    });
  });

  describe('the kind enum is the whole checklist set, off-map included', () => {
    it('VALID: {options} => are terminal, branch, observable and off-map', () => {
      expect(FLOWRIDER_KINDS).toStrictEqual(['terminal', 'branch', 'observable', 'off-map']);
    });

    it.each(FLOWRIDER_KINDS)('VALID: {kind: %s} => parses', (kind) => {
      expect(WorkPlanFlowriderUnitStub({ kind }).kind).toBe(kind);
    });
  });

  describe('surface is orchestrator-filled, so a planner leaves it out', () => {
    it('VALID: {no surface key} => parses, and no surface key appears on the result', () => {
      expect('surface' in WorkPlanFlowriderUnitStub()).toBe(false);
    });

    it('VALID: {surface supplied} => parses today, because the field is merely optional', () => {
      expect(
        WorkPlanFlowriderUnitStub({
          surface: 'the rendered DOM in a real, attached, VISIBLE browser tab',
        }).surface,
      ).toBe('the rendered DOM in a real, attached, VISIBLE browser tab');
    });
  });

  describe('invalid units', () => {
    it('EMPTY: {empty object} => refused', () => {
      expect(workPlanFlowriderUnitContract.safeParse({}).success).toBe(false);
    });

    it('INVALID: {no observableTarget} => refused', () => {
      expect(
        workPlanFlowriderUnitContract.safeParse({
          unitId: 'send-flow:terminal:batch-sent',
          kind: 'terminal',
          layer: 'browser',
          assert: 'the queue panel renders zero rows once the send resolves',
          failsIf: 'the panel still renders the sent rows',
        }).success,
      ).toBe(false);
    });

    it('INVALID: {layer: api} => refused', () => {
      expect(() => WorkPlanFlowriderUnitStub({ layer: 'api' as never })).toThrow(
        /Invalid enum value/u,
      );
    });

    it("INVALID: {unitId: 'offmap:hostile-input'} => refused, since an off-map unit id is flow-scoped and hyphenated", () => {
      expect(() => WorkPlanFlowriderUnitStub({ unitId: 'offmap:hostile-input' })).toThrow(
        /Invalid/u,
      );
    });
  });
});
