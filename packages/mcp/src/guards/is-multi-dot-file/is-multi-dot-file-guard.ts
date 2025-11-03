/**
 * PURPOSE: Checks if a file path represents a multi-dot file (.test.ts, .proxy.ts, etc.)
 *
 * USAGE:
 * const isMultiDot = isMultiDotFileGuard({ filepath: FilePathStub({ value: '/test/user-broker.test.ts' }) });
 * // Returns: true (file has multiple dots before extension)
 */

const MULTI_DOT_PATTERN = /\.[a-z]+\.(ts|tsx)$/u;

export const isMultiDotFileGuard = ({ filepath }: { filepath?: string }): boolean => {
  if (!filepath) {
    return false;
  }

  const filename = filepath.split('/').pop() ?? '';
  return MULTI_DOT_PATTERN.test(filename);
};
