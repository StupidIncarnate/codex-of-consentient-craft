import {
  FlowStub,
  FlowNodeStub,
  FlowObservableStub,
  ObservableIdStub,
} from '@dungeonmaster/shared/contracts';

import { questObservableIdsUniqueInNodeGuard } from './quest-observable-ids-unique-in-node-guard';

describe('questObservableIdsUniqueInNodeGuard', () => {
  describe('unique ids', () => {
    it('VALID: {node with distinct observable ids} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              type: 'terminal',
              observables: [
                FlowObservableStub({
                  id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
                }),
                FlowObservableStub({
                  id: ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' }),
                }),
              ],
            }),
          ],
        }),
      ];

      const result = questObservableIdsUniqueInNodeGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {same observable id in different nodes} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              id: 'node-a',
              type: 'terminal',
              observables: [
                FlowObservableStub({
                  id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
                }),
              ],
            }),
            FlowNodeStub({
              id: 'node-b',
              type: 'terminal',
              observables: [
                FlowObservableStub({
                  id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
                }),
              ],
            }),
          ],
        }),
      ];

      const result = questObservableIdsUniqueInNodeGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questObservableIdsUniqueInNodeGuard({ flows: [] });

      expect(result).toBe(true);
    });
  });

  describe('duplicate ids', () => {
    it('INVALID: {two observables with same id in one node} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              type: 'terminal',
              observables: [
                FlowObservableStub({
                  id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
                }),
                FlowObservableStub({
                  id: ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' }),
                }),
              ],
            }),
          ],
        }),
      ];

      const result = questObservableIdsUniqueInNodeGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questObservableIdsUniqueInNodeGuard({});

      expect(result).toBe(false);
    });
  });
});
