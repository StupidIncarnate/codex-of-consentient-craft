import {
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  ObservableIdStub,
} from '@dungeonmaster/shared/contracts';

import { questObservableHasDescriptionGuard } from './quest-observable-has-description-guard';

type Flow = ReturnType<typeof FlowStub>;
type FlowObservable = ReturnType<typeof FlowObservableStub>;

/**
 * Creates a FlowObservable with the description field overridden post-parse, used to inject
 * empty-description observables that bypass Zod validation.
 */
const createObservableWithEmptyDescription = (): FlowObservable => {
  const base = FlowObservableStub({
    id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
  });
  return { ...base, description: '' } as FlowObservable;
};

/**
 * Wraps a given observable in a valid flow + node structure so the guard can walk it.
 */
const createFlowWithObservable = ({ observable }: { observable: FlowObservable }): Flow => {
  return FlowStub({
    nodes: [FlowNodeStub({ type: 'terminal', observables: [observable] })],
  });
};

describe('questObservableHasDescriptionGuard', () => {
  describe('valid observables', () => {
    it('VALID: {observable with non-empty description} => returns true', () => {
      const observable = FlowObservableStub({
        id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
        description: 'redirects to /dashboard',
      });
      const flows = [createFlowWithObservable({ observable })];

      const result = questObservableHasDescriptionGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {no observables at all} => returns true', () => {
      const flows = [FlowStub({ nodes: [FlowNodeStub({ observables: [] })] })];

      const result = questObservableHasDescriptionGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questObservableHasDescriptionGuard({ flows: [] });

      expect(result).toBe(true);
    });
  });

  describe('empty descriptions', () => {
    it('INVALID: {observable with empty description} => returns false', () => {
      const observable = createObservableWithEmptyDescription();
      const flows = [createFlowWithObservable({ observable })];

      const result = questObservableHasDescriptionGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questObservableHasDescriptionGuard({});

      expect(result).toBe(false);
    });
  });
});
