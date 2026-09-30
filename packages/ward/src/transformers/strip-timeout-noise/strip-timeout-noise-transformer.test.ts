
import { stripTimeoutNoiseTransformer } from './strip-timeout-noise-transformer';

describe('stripTimeoutNoiseTransformer', () => {
  describe('jest timeout patterns', () => {
    it('VALID: {message: "Exceeded timeout of 5000 ms for a test."} => returns fallback message', () => {
      const message = 'Exceeded timeout of 5000 ms for a test.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: "Exceeded timeout of 30 s for a test."} => returns fallback message', () => {
      const message = 'Exceeded timeout of 30 s for a test.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: hook timeout} => returns fallback message', () => {
      const message = 'Exceeded timeout of 5000 ms for a hook.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: done() callback test timeout} => returns fallback message', () => {
      const message = 'Exceeded timeout of 5000 ms for a test while waiting for `done()` to be called.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: done() callback hook timeout} => returns fallback message', () => {
      const message = 'Exceeded timeout of 5000 ms for a hook while waiting for `done()` to be called.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: thrown format} => returns fallback message', () => {
      const message = 'thrown: "Exceeded timeout of 5000 ms for a test."';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: jest suggestion suffix} => strips suggestion text', () => {
      const message = 'Some error\nAdd a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Some error');
    });

    it('VALID: {message: full jest timeout with suggestion} => returns fallback message', () => {
      const message = 'Exceeded timeout of 30000 ms for a test.\nAdd a timeout value to this test to increase the timeout, if this is a long-running test. See https://jestjs.io/docs/api#testname-fn-timeout.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });
  });

  describe('playwright timeout patterns', () => {
    it('VALID: {message: "Test timeout of 10000ms exceeded."} => returns fallback message', () => {
      const message = 'Test timeout of 10000ms exceeded.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright fixture setup timeout} => returns fallback message', () => {
      const message = 'Test timeout of 30000ms exceeded while setting up "page".';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright fixture teardown timeout} => returns fallback message', () => {
      const message = 'Tearing down "browser" exceeded the test timeout of 30000ms.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright hook timeout} => returns fallback message', () => {
      const message = 'Test timeout of 30000ms exceeded while running "beforeEach" hook.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright beforeAll hook timeout} => returns fallback message', () => {
      const message = '"beforeAll" hook timeout of 60000ms exceeded.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright fixture custom timeout} => returns fallback message', () => {
      const message = 'Fixture "database" timeout of 10000ms exceeded during setup.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright worker teardown timeout} => returns fallback message', () => {
      const message = 'Worker teardown timeout of 30000ms exceeded.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright worker teardown with fixture} => returns fallback message', () => {
      const message = 'Worker teardown timeout of 30000ms exceeded while tearing "browser".';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright modifier timeout} => returns fallback message', () => {
      const message = '"slow" modifier timeout of 5000ms exceeded.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright step timeout} => returns fallback message', () => {
      const message = 'Step timeout of 5000ms exceeded.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright event wait timeout} => returns fallback message', () => {
      const message = 'Timeout 30000ms exceeded while waiting for event "response"';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright predicate timeout} => returns fallback message', () => {
      const message = 'Timeout 5000ms exceeded while waiting on the predicate';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright action timeout} => returns fallback message', () => {
      const message = 'Timeout 30000ms exceeded.';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });

    it('VALID: {message: playwright launch timeout without period} => returns fallback message', () => {
      const message = 'Timeout 30000ms exceeded';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });
  });

  describe('mixed content', () => {
    it('VALID: {message: timeout mixed with call log} => strips timeout, keeps call log', () => {
      const message = 'Error: page.waitForResponse: Test timeout of 10000ms exceeded.\nCall log: waiting for response';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(
        'Error: page.waitForResponse: \nCall log: waiting for response',
      );
    });

    it('VALID: {message: playwright timeout with call log context} => strips timeout, keeps context', () => {
      const message = 'Error: locator.click: Timeout 5000ms exceeded.\nCall log:\n  - waiting for locator("#submit")';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe(
        'Error: locator.click: \nCall log:\n  - waiting for locator("#submit")',
      );
    });
  });

  describe('no timeout pattern', () => {
    it('VALID: {message: regular error} => returns original message', () => {
      const message = 'Expected true to be false';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Expected true to be false');
    });
  });

  describe('empty after stripping', () => {
    it('VALID: {message: only whitespace after stripping} => returns fallback message', () => {
      const message = '  Exceeded timeout of 5000 ms for a test.  ';

      const result = stripTimeoutNoiseTransformer({ message });

      expect(result).toBe('Timed out (see network log below)');
    });
  });
});
