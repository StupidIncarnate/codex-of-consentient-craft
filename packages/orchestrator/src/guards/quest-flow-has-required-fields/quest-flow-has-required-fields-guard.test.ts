import { FlowStub } from '@dungeonmaster/shared/contracts';

import { questFlowHasRequiredFieldsGuard } from './quest-flow-has-required-fields-guard';

type Flow = ReturnType<typeof FlowStub>;

/**
 * Creates a Flow-shaped object with an override applied after Zod parsing, to intentionally
 * inject invalid values (empty arrays, empty strings, invalid enum values) that Zod would
 * reject. This lets the guard test its runtime defensive checks against externally-bypassed
 * data.
 */
const createFlowWithOverride = (override: Partial<Record<keyof Flow, unknown>>): Flow => {
  const base = FlowStub();
  return { ...base, ...override } as Flow;
};

describe('questFlowHasRequiredFieldsGuard', () => {
  describe('valid flows', () => {
    it('VALID: {flow with all required fields} => returns true', () => {
      const flow = FlowStub();
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {flow with flowType operational} => returns true', () => {
      const flow = FlowStub({ flowType: 'operational' });
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {flow with multiple exitPoints} => returns true', () => {
      const flow = FlowStub({ exitPoints: ['/dashboard', '/login (error)'] });
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const flows: Flow[] = [];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(true);
    });
  });

  describe('invalid flows', () => {
    it('INVALID: {flow with empty exitPoints array} => returns false', () => {
      const flow = createFlowWithOverride({ exitPoints: [] });
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {flow with invalid flowType} => returns false', () => {
      const flow = createFlowWithOverride({ flowType: 'bogus' });
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {flow with empty id} => returns false', () => {
      const flow = createFlowWithOverride({ id: '' });
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {flow with empty entryPoint} => returns false', () => {
      const flow = createFlowWithOverride({ entryPoint: '' });
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {flow with empty name} => returns false', () => {
      const flow = createFlowWithOverride({ name: '' });
      const flows = [flow];

      const result = questFlowHasRequiredFieldsGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questFlowHasRequiredFieldsGuard({});

      expect(result).toBe(false);
    });
  });
});
