/**
 * PURPOSE: Decides whether a Jest test file does real I/O by design — an integration or e2e test —
 * so a cover that only makes sense against a mocked boundary (MSW's unhandled-request/unhandled-
 * connection check) can skip itself there instead of failing a test that opens a real socket on
 * purpose. Mirrors `jest.setup-io-trap.js`'s own `REAL_IO_TEST_FILE` pattern; that file cannot
 * import this one, since it runs as a `setupFiles` entry before ts-jest transforms anything.
 *
 * USAGE:
 * isRealIoTestFileGuard({ testPath: '/repo/packages/x/src/y.integration.test.ts' })
 * // Returns true
 * isRealIoTestFileGuard({ testPath: '/repo/packages/x/src/y.test.ts' })
 * // Returns false
 */

export const isRealIoTestFileGuard = ({ testPath }: { testPath?: string }): boolean => {
  if (testPath === undefined || testPath.length === 0) {
    return false;
  }

  return /\.(?:integration\.test|e2e)\.[jt]sx?$/u.test(testPath);
};
