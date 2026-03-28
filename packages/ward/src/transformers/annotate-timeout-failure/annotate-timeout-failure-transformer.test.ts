import { ErrorMessageStub } from '@dungeonmaster/shared/contracts';

import { annotateTimeoutFailureTransformer } from './annotate-timeout-failure-transformer';

const EXPECTED_ANNOTATION = ErrorMessageStub({
  value: [
    'TIMEOUT: Test killed before reaching any expect() calls.',
    'This is NOT a missing assertion — something upstream hung.',
    'Do NOT rerun. Trace the code path from the test entry point.',
    'Common causes: poll loop waiting for unreachable state, swallowed',
    'error in catch handler, contract validation failure in async pipeline.',
  ].join('\n'),
});

describe('annotateTimeoutFailureTransformer', () => {
  describe('timeout + no assertions combo', () => {
    it('VALID: {jest timeout + no assertions} => returns annotation', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [
          'thrown: "Exceeded timeout of 30000 ms for a test.\nAdd a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout."',
          'Error: Test "my test" has no assertions. Add expect() calls or remove the test.',
        ],
      });

      expect(result).toBe(EXPECTED_ANNOTATION);
    });

    it('VALID: {jest thrown empty string + no assertions} => returns annotation', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [
          'thrown: ""',
          'Error: Test "my test" has no assertions. Add expect() calls or remove the test.',
        ],
      });

      expect(result).toBe(EXPECTED_ANNOTATION);
    });

    it('VALID: {jest thrown with newline + no assertions} => returns annotation', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [
          'thrown: "\nAdd a timeout value to this test to increase the timeout, if this is a long-running test.',
          'Error: Test "my test" has no assertions. Add expect() calls or remove the test.',
        ],
      });

      expect(result).toBe(EXPECTED_ANNOTATION);
    });

    it('VALID: {playwright test timeout + no assertions} => returns annotation', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [
          'Test timeout of 30000ms exceeded.',
          'Error: Test "my test" has no assertions. Add expect() calls or remove the test.',
        ],
      });

      expect(result).toBe(EXPECTED_ANNOTATION);
    });

    it('VALID: {playwright fixture timeout + no assertions} => returns annotation', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [
          'Fixture "page" timeout of 10000ms exceeded during setup.',
          'Error: Test "my test" has no assertions. Add expect() calls or remove the test.',
        ],
      });

      expect(result).toBe(EXPECTED_ANNOTATION);
    });

    it('VALID: {playwright action timeout + no assertions} => returns annotation', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [
          'Timeout 5000ms exceeded while waiting for event "response"',
          'Error: Test "my test" has no assertions. Add expect() calls or remove the test.',
        ],
      });

      expect(result).toBe(EXPECTED_ANNOTATION);
    });
  });

  describe('timeout only (no assertions error absent)', () => {
    it('VALID: {jest timeout only} => returns null', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: ['thrown: "Exceeded timeout of 30000 ms for a test."'],
      });

      expect(result).toBeNull();
    });

    it('VALID: {playwright timeout only} => returns null', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: ['Test timeout of 30000ms exceeded.'],
      });

      expect(result).toBeNull();
    });
  });

  describe('no assertions only (timeout absent)', () => {
    it('VALID: {no assertions without timeout} => returns null', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [
          'Error: Test "my test" has no assertions. Add expect() calls or remove the test.',
        ],
      });

      expect(result).toBeNull();
    });
  });

  describe('no match', () => {
    it('VALID: {regular assertion error} => returns null', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: ['Expected true to be false'],
      });

      expect(result).toBeNull();
    });

    it('EMPTY: {empty failureMessages} => returns null', () => {
      const result = annotateTimeoutFailureTransformer({
        failureMessages: [],
      });

      expect(result).toBeNull();
    });
  });
});
