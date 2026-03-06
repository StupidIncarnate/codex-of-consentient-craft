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
    it('VALID: {observables: [1 observable]} => returns single assertion', () => {
      const node = FlowNodeStub({
        observables: [FlowObservableStub()],
      });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual(['redirects to dashboard']);
    });
  });

  describe('node with multiple observables', () => {
    it('VALID: {observables: [3 observables]} => returns all descriptions', () => {
      const node = FlowNodeStub({
        observables: [
          FlowObservableStub({
            id: 'shows-login-form',
            type: 'ui-state',
            description: 'shows login form',
          }),
          FlowObservableStub({
            id: 'disables-submit-button',
            type: 'ui-state',
            description: 'disables submit button',
          }),
          FlowObservableStub({
            id: 'displays-error-banner',
            type: 'ui-state',
            description: 'displays error banner',
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
    it('VALID: {description: 201+ chars} => truncates at 200 with ellipsis', () => {
      const longText = 'a'.repeat(201);
      const node = FlowNodeStub({
        observables: [
          FlowObservableStub({
            description: longText,
          }),
        ],
      });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual([`${'a'.repeat(200)}...`]);
    });

    it('VALID: {description: exactly 200 chars} => returns unchanged', () => {
      const exactText = 'a'.repeat(200);
      const node = FlowNodeStub({
        observables: [
          FlowObservableStub({
            description: exactText,
          }),
        ],
      });

      const result = collectNodeAssertionsTransformer({ node });

      expect(result).toStrictEqual([exactText]);
    });
  });
});
