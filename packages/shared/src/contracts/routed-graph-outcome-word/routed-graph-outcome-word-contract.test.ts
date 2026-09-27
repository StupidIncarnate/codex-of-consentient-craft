import { routedGraphOutcomeWordContract } from './routed-graph-outcome-word-contract';
import { RoutedGraphOutcomeWordStub } from './routed-graph-outcome-word.stub';

describe('routedGraphOutcomeWordContract', () => {
  describe('valid keys', () => {
    it('VALID: {value: "done"} => parses successfully', () => {
      const key = RoutedGraphOutcomeWordStub({ value: 'done' });

      const result = routedGraphOutcomeWordContract.parse(key);

      expect(result).toBe('done');
    });

    it('VALID: {value: "pass:"} => parses a non-canonical word the same way', () => {
      const key = RoutedGraphOutcomeWordStub({ value: 'pass:' });

      const result = routedGraphOutcomeWordContract.parse(key);

      expect(result).toBe('pass:');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {value: 123} => throws validation error', () => {
      expect(() => routedGraphOutcomeWordContract.parse(123 as never)).toThrow(/expected string/u);
    });
  });
});
