/**
 * PURPOSE: Checks if a file path represents a multi-dot companion file (.test.ts, .proxy.ts, etc.)
 *
 * USAGE:
 * const isMultiDot = isMultiDotFileGuard({ filepath: FilePathStub({ value: '/test/user-broker.test.ts' }) });
 * // Returns: true (file has multiple dots before extension)
 */

import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';

const MULTI_DOT_PATTERN = /\.[a-z]+\.(ts|tsx|js|jsx)$/u;

// Matches files that end with a standalone suffix directly before the extension
// e.g. "foo.harness.ts" matches, but "foo.harness.integration.test.ts" does not
const STANDALONE_SUFFIX_PATTERNS = fileDiscoveryStatics.standaloneMultiDotSuffixes.map(
  (suffix) => new RegExp(`\\${suffix}(ts|tsx|js|jsx)$`, 'u'),
);

export const isMultiDotFileGuard = ({ filepath }: { filepath?: string }): boolean => {
  if (!filepath) {
    return false;
  }

  const filename = filepath.split('/').pop() ?? '';

  if (!MULTI_DOT_PATTERN.test(filename)) {
    return false;
  }

  // Check if this is a standalone multi-dot file (e.g. .harness.ts, .harness.tsx)
  // These end with the suffix directly before the extension, with no additional dot segments
  if (STANDALONE_SUFFIX_PATTERNS.some((pattern) => pattern.test(filename))) {
    return false;
  }

  return true;
};
