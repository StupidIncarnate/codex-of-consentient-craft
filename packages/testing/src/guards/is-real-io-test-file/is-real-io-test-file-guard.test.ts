import { isRealIoTestFileGuard } from './is-real-io-test-file-guard';

describe('isRealIoTestFileGuard', () => {
  describe('real-I/O test files', () => {
    it('VALID: {testPath: "foo.integration.test.ts"} => returns true', () => {
      const result = isRealIoTestFileGuard({ testPath: 'foo.integration.test.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {testPath: "foo.integration.test.tsx"} => returns true', () => {
      const result = isRealIoTestFileGuard({ testPath: 'foo.integration.test.tsx' });

      expect(result).toBe(true);
    });

    it('VALID: {testPath: "foo.e2e.ts"} => returns true', () => {
      const result = isRealIoTestFileGuard({ testPath: 'foo.e2e.ts' });

      expect(result).toBe(true);
    });

    it('VALID: {testPath: "/repo/packages/hydration/src/adapters/fetch/post/fetch-post-adapter.integration.test.ts"} => returns true', () => {
      const result = isRealIoTestFileGuard({
        testPath:
          '/repo/packages/hydration/src/adapters/fetch/post/fetch-post-adapter.integration.test.ts',
      });

      expect(result).toBe(true);
    });
  });

  describe('unit test files', () => {
    it('INVALID: {testPath: "foo.test.ts"} => returns false', () => {
      const result = isRealIoTestFileGuard({ testPath: 'foo.test.ts' });

      expect(result).toBe(false);
    });

    it('INVALID: {testPath: "foo.integration.test.ts.bak"} => returns false', () => {
      const result = isRealIoTestFileGuard({ testPath: 'foo.integration.test.ts.bak' });

      expect(result).toBe(false);
    });

    it('INVALID: {testPath: "foo-e2e-helper.ts"} => returns false', () => {
      const result = isRealIoTestFileGuard({ testPath: 'foo-e2e-helper.ts' });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {testPath: undefined} => returns false', () => {
      const result = isRealIoTestFileGuard({});

      expect(result).toBe(false);
    });

    it('EMPTY: {testPath: ""} => returns false', () => {
      const result = isRealIoTestFileGuard({ testPath: '' });

      expect(result).toBe(false);
    });
  });
});
