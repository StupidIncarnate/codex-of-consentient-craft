import { isInTestDirGuard } from './is-in-test-dir-guard';

describe('isInTestDirGuard', () => {
  describe('files in test directory', () => {
    it('VALID: {filename: "/project/test/harnesses/guild/guild.harness.ts"} => returns true', () => {
      const result = isInTestDirGuard({
        filename: '/project/test/harnesses/guild/guild.harness.ts',
      });

      expect(result).toBe(true);
    });

    it('VALID: {filename: "/project/packages/testing/test/harnesses/claude-mock/claude-mock.harness.ts"} => returns true', () => {
      const result = isInTestDirGuard({
        filename: '/project/packages/testing/test/harnesses/claude-mock/claude-mock.harness.ts',
      });

      expect(result).toBe(true);
    });
  });

  describe('files not in test directory', () => {
    it('VALID: {filename: "/project/src/brokers/guild/guild-broker.ts"} => returns false', () => {
      const result = isInTestDirGuard({
        filename: '/project/src/brokers/guild/guild-broker.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "/project/e2e/web/smoke.spec.ts"} => returns false', () => {
      const result = isInTestDirGuard({
        filename: '/project/e2e/web/smoke.spec.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "/project/src/brokers/guild/guild-broker.test.ts"} => returns false', () => {
      const result = isInTestDirGuard({
        filename: '/project/src/brokers/guild/guild-broker.test.ts',
      });

      expect(result).toBe(false);
    });
  });

  describe('test as substring (not directory)', () => {
    it('VALID: {filename: "/project/src/brokers/test-utils/helper.ts"} => returns false', () => {
      const result = isInTestDirGuard({
        filename: '/project/src/brokers/test-utils/helper.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "/project/contest/file.ts"} => returns false', () => {
      const result = isInTestDirGuard({
        filename: '/project/contest/file.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "/project/tests/helpers/file.ts"} => returns false (tests/ plural, not test/)', () => {
      const result = isInTestDirGuard({
        filename: '/project/tests/helpers/file.ts',
      });

      expect(result).toBe(false);
    });

    it('VALID: {filename: "/project/__tests__/file.ts"} => returns false', () => {
      const result = isInTestDirGuard({
        filename: '/project/__tests__/file.ts',
      });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {filename: undefined} => returns false', () => {
      const result = isInTestDirGuard({ filename: undefined });

      expect(result).toBe(false);
    });

    it('EMPTY: {filename: ""} => returns false', () => {
      const result = isInTestDirGuard({ filename: '' });

      expect(result).toBe(false);
    });
  });
});
