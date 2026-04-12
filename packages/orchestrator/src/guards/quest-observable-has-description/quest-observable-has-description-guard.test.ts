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

/**
 * Overwrites the `description` field to `undefined` on every observable reachable in the
 * given flow where the provided `match` predicate returns true. This bypasses Zod's
 * parse-time validation so we can simulate malformed data reaching the guard.
 */
const stripDescriptionWhere = ({
  flow,
  match,
}: {
  flow: Flow;
  match: (observable: FlowObservable) => boolean;
}): void => {
  flow.nodes.forEach((node) => {
    node.observables.forEach((observable) => {
      if (match(observable)) {
        const mutable = observable as unknown as Record<'description', unknown>;
        mutable.description = undefined;
      }
    });
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

  describe('undefined descriptions', () => {
    it('INVALID: {observable with undefined description} => returns false', () => {
      const strippedId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const observable = FlowObservableStub({
        id: strippedId,
        description: 'placeholder',
      });
      const flow = createFlowWithObservable({ observable });
      stripDescriptionWhere({ flow, match: (item) => item.id === strippedId });

      const result = questObservableHasDescriptionGuard({ flows: [flow] });

      expect(result).toBe(false);
    });

    it('INVALID: {mixed observables with one undefined description} => returns false', () => {
      const validId = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-8d9e-1f2a3b4c5d6e' });
      const strippedId = ObservableIdStub({ value: 'c3d4e5f6-a7b8-4c5d-8e9f-2a3b4c5d6e7f' });
      const validObservable = FlowObservableStub({
        id: validId,
        description: 'redirects to /dashboard',
      });
      const placeholderObservable = FlowObservableStub({
        id: strippedId,
        description: 'will be stripped',
      });
      const flow = FlowStub({
        nodes: [
          FlowNodeStub({
            type: 'terminal',
            observables: [validObservable, placeholderObservable],
          }),
        ],
      });
      stripDescriptionWhere({ flow, match: (item) => item.id === strippedId });

      const result = questObservableHasDescriptionGuard({ flows: [flow] });

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
