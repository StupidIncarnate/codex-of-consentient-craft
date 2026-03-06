import { FlowNodeStub } from '../../contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '../../contracts/flow-observable/flow-observable.stub';

import { collectNodeAssertionsTransformer } from './collect-node-assertions-transformer';

describe('collectNodeAssertionsTransformer', () => {
  describe('node without observables', () => {
    it('EMPTY: {observables: []} => returns empty array', () => {
      const node = FlowNodeStub({ observables: [] });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual([]);
    });
  });

  describe('node with single observable', () => {
    it('VALID: {observables: [1 then entry]} => returns single assertion', () => {
      const node = FlowNodeStub({
        observables: [FlowObservableStub()],
      });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual(['redirects to dashboard']);
    });
  });

  describe('node with multiple observables', () => {
    it('VALID: {observables: [2 observables]} => flattens all then entries', () => {
      const node = FlowNodeStub({
        observables: [
          FlowObservableStub({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            then: [
              { type: 'ui-state', description: 'shows login form' },
              { type: 'ui-state', description: 'disables submit button' },
            ],
          }),
          FlowObservableStub({
            id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
            then: [{ type: 'ui-state', description: 'displays error banner' }],
          }),
        ],
      });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual([
        'shows login form',
        'disables submit button',
        'displays error banner',
      ]);
    });
  });

  describe('truncation', () => {
    it('VALID: {description: 61+ chars} => truncates at 60 with ellipsis', () => {
      const longText = 'a'.repeat(61);
      const node = FlowNodeStub({
        observables: [
          FlowObservableStub({
            then: [{ type: 'ui-state', description: longText }],
          }),
        ],
      });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual([`${'a'.repeat(60)}...`]);
    });

    it('VALID: {description: exactly 60 chars} => returns unchanged', () => {
      const exactText = 'a'.repeat(60);
      const node = FlowNodeStub({
        observables: [
          FlowObservableStub({
            then: [{ type: 'ui-state', description: exactText }],
          }),
        ],
      });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual([exactText]);
    });
  });
});
