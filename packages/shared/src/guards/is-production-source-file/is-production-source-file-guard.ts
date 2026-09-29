/**
 * PURPOSE: Returns true for a repo-relative source path that ships: not a test, proxy, stub, harness
 * or e2e file, not a `.d.ts` declaration, and not under a `test/`, `tests/`, `e2e/`, `__mocks__/`,
 * `test-fixtures/`, `node_modules/` or `dist/` folder.
 * Reach for this when a scan must count only the code that runs in production, such as the
 * contract index deciding whether a contract is parsed.
 *
 * USAGE:
 * isProductionSourceFileGuard({ relativePath: 'packages/a/src/brokers/x/x-broker.ts' });
 * // Returns true — production code
 */

const TEST_SUPPORT_FILE_PATTERN =
  /\.(?:test|integration\.test|e2e|spec|proxy|stub|harness)\.tsx?$|\.d\.ts$/u;
const TEST_SUPPORT_FOLDER_PATTERN =
  /(?:^|\/)(?:test|tests|e2e|__mocks__|test-fixtures|node_modules|dist)\//u;

export const isProductionSourceFileGuard = ({
  relativePath,
}: {
  relativePath?: string;
}): boolean => {
  if (relativePath === undefined) {
    return false;
  }
  return (
    !TEST_SUPPORT_FILE_PATTERN.test(relativePath) && !TEST_SUPPORT_FOLDER_PATTERN.test(relativePath)
  );
};
