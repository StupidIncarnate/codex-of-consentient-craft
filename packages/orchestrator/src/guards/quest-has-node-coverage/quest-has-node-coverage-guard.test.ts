import { FlowStub, FlowNodeStub, FlowObservableStub } from '@dungeonmaster/shared/contracts';

import { questHasNodeCoverageGuard } from './quest-has-node-coverage-guard';

describe('questHasNodeCoverageGuard', () => {
  describe('valid coverage', () => {
    it('VALID: {terminal node with observables} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              id: 'success',
              type: 'terminal',
              observables: [FlowObservableStub()],
            }),
          ],
        }),
      ];

      const result = questHasNodeCoverageGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {non-terminal node without observables} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              id: 'login-page',
              type: 'state',
              observables: [],
            }),
          ],
        }),
      ];

      const result = questHasNodeCoverageGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {empty flows array} => returns true', () => {
      const result = questHasNodeCoverageGuard({ flows: [] });

      expect(result).toBe(true);
    });

    it('VALID: {flow with no nodes} => returns true', () => {
      const flows = [FlowStub({ nodes: [] })];

      const result = questHasNodeCoverageGuard({ flows });

      expect(result).toBe(true);
    });

    it('VALID: {multiple terminal nodes all with observables} => returns true', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              id: 'success',
              type: 'terminal',
              observables: [FlowObservableStub({ id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' })],
            }),
            FlowNodeStub({
              id: 'error',
              type: 'terminal',
              observables: [FlowObservableStub({ id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' })],
            }),
          ],
        }),
      ];

      const result = questHasNodeCoverageGuard({ flows });

      expect(result).toBe(true);
    });
  });

  describe('invalid coverage', () => {
    it('INVALID: {terminal node without observables} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              id: 'success',
              type: 'terminal',
              observables: [],
            }),
          ],
        }),
      ];

      const result = questHasNodeCoverageGuard({ flows });

      expect(result).toBe(false);
    });

    it('INVALID: {one terminal with observables, one without} => returns false', () => {
      const flows = [
        FlowStub({
          nodes: [
            FlowNodeStub({
              id: 'success',
              type: 'terminal',
              observables: [FlowObservableStub()],
            }),
            FlowNodeStub({
              id: 'error',
              type: 'terminal',
              observables: [],
            }),
          ],
        }),
      ];

      const result = questHasNodeCoverageGuard({ flows });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {flows: undefined} => returns false', () => {
      const result = questHasNodeCoverageGuard({});

      expect(result).toBe(false);
    });
  });
});
