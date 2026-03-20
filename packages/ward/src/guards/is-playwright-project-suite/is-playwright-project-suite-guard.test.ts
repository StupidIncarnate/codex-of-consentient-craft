import { isPlaywrightProjectSuiteGuard } from './is-playwright-project-suite-guard';

describe('isPlaywrightProjectSuiteGuard', () => {
  describe('project suites', () => {
    it('VALID: {suite with nested suites and no specs} => returns true', () => {
      const result = isPlaywrightProjectSuiteGuard({
        suite: { title: 'chromium', suites: [{ title: 'login.spec.ts' }], specs: [] },
      });

      expect(result).toBe(true);
    });

    it('VALID: {suite with nested suites and missing specs key} => returns true', () => {
      const result = isPlaywrightProjectSuiteGuard({
        suite: { title: 'chromium', suites: [{ title: 'login.spec.ts' }] },
      });

      expect(result).toBe(true);
    });
  });

  describe('file suites', () => {
    it('INVALID: {suite with specs} => returns false', () => {
      const result = isPlaywrightProjectSuiteGuard({
        suite: { title: 'login.spec.ts', suites: [], specs: [{ title: 'should login' }] },
      });

      expect(result).toBe(false);
    });

    it('INVALID: {suite with no nested suites and no specs} => returns false', () => {
      const result = isPlaywrightProjectSuiteGuard({
        suite: { title: 'empty.spec.ts', suites: [], specs: [] },
      });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {suite: undefined} => returns false', () => {
      const result = isPlaywrightProjectSuiteGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {suite: null} => returns false', () => {
      const result = isPlaywrightProjectSuiteGuard({ suite: null });

      expect(result).toBe(false);
    });

    it('EMPTY: {suite: string} => returns false', () => {
      const result = isPlaywrightProjectSuiteGuard({ suite: 'not an object' });

      expect(result).toBe(false);
    });
  });
});
