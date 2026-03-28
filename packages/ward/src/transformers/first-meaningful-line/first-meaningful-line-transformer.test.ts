import { TestFailureStub } from '../../contracts/test-failure/test-failure.stub';
import { SummaryLineStub } from '../../contracts/summary-line/summary-line.stub';
import { firstMeaningfulLineTransformer } from './first-meaningful-line-transformer';

describe('firstMeaningfulLineTransformer', () => {
  describe('meaningful first line', () => {
    it('VALID: {message: regular error} => returns first line', () => {
      const { message } = TestFailureStub({
        message: 'Expected true to be false\n    at Object.<anonymous> (/path:10:5)',
      });

      const result = firstMeaningfulLineTransformer({ message });

      expect(result).toBe(SummaryLineStub({ value: 'Expected true to be false' }));
    });

    it('VALID: {message: single line} => returns that line', () => {
      const { message } = TestFailureStub({ message: 'Assertion error' });

      const result = firstMeaningfulLineTransformer({ message });

      expect(result).toBe(SummaryLineStub({ value: 'Assertion error' }));
    });
  });

  describe('useless first line', () => {
    it('VALID: {message: thrown quote then real error} => skips to meaningful line', () => {
      const { message } = TestFailureStub({
        message: 'Error: thrown: "\nActual meaningful error',
      });

      const result = firstMeaningfulLineTransformer({ message });

      expect(result).toBe(SummaryLineStub({ value: 'Actual meaningful error' }));
    });

    it('VALID: {message: timeout annotation} => returns annotation first line', () => {
      const { message } = TestFailureStub({
        message:
          'TIMEOUT: Test killed before reaching any expect() calls.\nThis is NOT a missing assertion.',
      });

      const result = firstMeaningfulLineTransformer({ message });

      expect(result).toBe(
        SummaryLineStub({
          value: 'TIMEOUT: Test killed before reaching any expect() calls.',
        }),
      );
    });

    it('VALID: {message: jest suggestion before real content} => skips suggestion', () => {
      const { message } = TestFailureStub({
        message:
          'Add a timeout value to this test to increase the timeout, if this is a long-running test.\nSome actual context here',
      });

      const result = firstMeaningfulLineTransformer({ message });

      expect(result).toBe(SummaryLineStub({ value: 'Some actual context here' }));
    });
  });

  describe('all useless lines', () => {
    it('EDGE: {message: only thrown quote} => falls back to first line', () => {
      const { message } = TestFailureStub({ message: 'Error: thrown: "' });

      const result = firstMeaningfulLineTransformer({ message });

      expect(result).toBe(SummaryLineStub({ value: 'Error: thrown: "' }));
    });
  });
});
