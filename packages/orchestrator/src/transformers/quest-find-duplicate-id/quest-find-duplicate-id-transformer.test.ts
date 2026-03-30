import {
  ErrorMessageStub,
  FlowNodeStub,
  FlowObservableStub,
} from '@dungeonmaster/shared/contracts';

import { questFindDuplicateIdTransformer } from './quest-find-duplicate-id-transformer';

describe('questFindDuplicateIdTransformer', () => {
  describe('no duplicates', () => {
    it('VALID: {unique ids} => returns undefined', () => {
      const items = [
        FlowNodeStub({ id: 'n1', label: 'A' }),
        FlowNodeStub({ id: 'n2', label: 'B' }),
      ];

      const result = questFindDuplicateIdTransformer({
        items,
        context: ErrorMessageStub({ value: 'nodes' }),
      });

      expect(result).toBe(undefined);
    });
  });

  describe('top-level duplicates', () => {
    it('VALID: {duplicate ids} => returns error message with id and context', () => {
      const items = [
        FlowNodeStub({ id: 'login-page', label: 'First' }),
        FlowNodeStub({ id: 'login-page', label: 'Second' }),
      ];

      const result = questFindDuplicateIdTransformer({
        items,
        context: ErrorMessageStub({ value: 'nodes' }),
      });

      expect(result).toBe(
        'Duplicate ID "login-page" in nodes — this ID already exists. Use a unique ID or omit to leave existing unchanged.',
      );
    });
  });

  describe('nested duplicates', () => {
    it('VALID: {duplicate observable ids in node} => returns error with nested context', () => {
      const obs1 = FlowObservableStub({ id: 'obs-dup', description: 'First' });
      const obs2 = FlowObservableStub({ id: 'obs-dup', description: 'Second' });
      const node = FlowNodeStub({ id: 'n1', observables: [obs1, obs2] });
      const items = [node];

      const result = questFindDuplicateIdTransformer({
        items,
        context: ErrorMessageStub({ value: 'nodes' }),
      });

      expect(result).toBe(
        'Duplicate ID "obs-dup" in nodes[n1].observables — this ID already exists. Use a unique ID or omit to leave existing unchanged.',
      );
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {items: []} => returns undefined', () => {
      const result = questFindDuplicateIdTransformer({
        items: [],
        context: ErrorMessageStub({ value: 'flows' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
