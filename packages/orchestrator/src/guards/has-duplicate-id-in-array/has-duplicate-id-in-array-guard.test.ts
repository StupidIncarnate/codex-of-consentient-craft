import { FlowNodeStub, FlowObservableStub } from '@dungeonmaster/shared/contracts';

import { hasDuplicateIdInArrayGuard } from './has-duplicate-id-in-array-guard';

describe('hasDuplicateIdInArrayGuard', () => {
  describe('no duplicates', () => {
    it('VALID: {items: [{id: "a"}, {id: "b"}]} => returns false', () => {
      const items = [FlowNodeStub({ id: 'a', label: 'A' }), FlowNodeStub({ id: 'b', label: 'B' })];

      const result = hasDuplicateIdInArrayGuard({ items });

      expect(result).toBe(false);
    });

    it('VALID: {single item} => returns false', () => {
      const items = [FlowNodeStub({ id: 'a', label: 'A' })];

      const result = hasDuplicateIdInArrayGuard({ items });

      expect(result).toBe(false);
    });
  });

  describe('top-level duplicates', () => {
    it('VALID: {items: [{id: "a"}, {id: "a"}]} => returns true', () => {
      const items = [
        FlowNodeStub({ id: 'a', label: 'First' }),
        FlowNodeStub({ id: 'a', label: 'Second' }),
      ];

      const result = hasDuplicateIdInArrayGuard({ items });

      expect(result).toBe(true);
    });
  });

  describe('nested duplicates', () => {
    it('VALID: {nested observables with duplicate ids} => returns true', () => {
      const obs1 = FlowObservableStub({ id: 'obs-dup', description: 'First' });
      const obs2 = FlowObservableStub({ id: 'obs-dup', description: 'Second' });
      const node = FlowNodeStub({ id: 'n1', observables: [obs1, obs2] });
      const items = [node];

      const result = hasDuplicateIdInArrayGuard({ items });

      expect(result).toBe(true);
    });

    it('VALID: {nested observables with unique ids} => returns false', () => {
      const obs1 = FlowObservableStub({ id: 'obs-1', description: 'First' });
      const obs2 = FlowObservableStub({ id: 'obs-2', description: 'Second' });
      const node = FlowNodeStub({ id: 'n1', observables: [obs1, obs2] });
      const items = [node];

      const result = hasDuplicateIdInArrayGuard({ items });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {items: undefined} => returns false', () => {
      const result = hasDuplicateIdInArrayGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {items: []} => returns false', () => {
      const result = hasDuplicateIdInArrayGuard({ items: [] });

      expect(result).toBe(false);
    });
  });
});
