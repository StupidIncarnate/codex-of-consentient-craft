import { routedGraphNodeKeyContract } from './routed-graph-node-key-contract';
import { RoutedGraphNodeKeyStub } from './routed-graph-node-key.stub';

describe('routedGraphNodeKeyContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "plan"} => parses successfully', () => {
      const key = RoutedGraphNodeKeyStub({ value: 'plan' });

      const result = routedGraphNodeKeyContract.parse(key);

      expect(result).toBe('plan');
    });

    it('VALID: {value: "@done"} => parses a terminal marker the same way', () => {
      const key = RoutedGraphNodeKeyStub({ value: '@done' });

      const result = routedGraphNodeKeyContract.parse(key);

      expect(result).toBe('@done');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => routedGraphNodeKeyContract.parse(123 as never)).toThrow(/Expected string/u);
    });
  });
});
