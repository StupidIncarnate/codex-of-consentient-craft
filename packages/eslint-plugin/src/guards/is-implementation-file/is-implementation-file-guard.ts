/**
 * PURPOSE: Checks if a file is an implementation file (single-dot, not multi-dot test/proxy/stub files)
 *
 * USAGE:
 * isImplementationFileGuard({ filename: 'src/brokers/user/user-broker.ts' }) // true
 * isImplementationFileGuard({ filename: 'src/brokers/user/user-broker.test.ts' }) // false (multi-dot)
 * isImplementationFileGuard({ filename: 'src/brokers/user/user-broker.proxy.ts' }) // false (multi-dot)
 *
 * RELATED: is-test-file-guard, has-file-suffix-guard
 */
export const isImplementationFileGuard = ({ filename }: { filename?: string }): boolean => {
  if (!filename) {
    return false;
  }

  // Extract basename from path
  const pathParts = filename.split('/');
  const basename = pathParts[pathParts.length - 1];

  if (!basename) {
    return false;
  }

  // Remove extension (.ts, .tsx, .js, .jsx)
  const nameWithoutExt = basename.replace(/\.(ts|tsx|js|jsx)$/u, '');

  // Count dots in the filename (without extension)
  const dotCount = (nameWithoutExt.match(/\./gu) ?? []).length;

  // Implementation files have no dots (single segment before extension)
  // Examples:
  //   user-broker.ts -> 0 dots -> implementation ✓
  //   user-broker.test.ts -> 1 dot -> multi-dot ✗
  //   user-broker.proxy.ts -> 1 dot -> multi-dot ✗
  //   user.stub.ts -> 1 dot -> multi-dot ✗
  return dotCount === 0;
};
