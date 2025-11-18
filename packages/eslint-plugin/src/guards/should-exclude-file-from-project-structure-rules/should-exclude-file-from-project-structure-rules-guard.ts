/**
 * PURPOSE: Determines if a file should be excluded from project structure rule validation
 *
 * USAGE:
 * if (shouldExcludeFileFromProjectStructureRulesGuard({ filename: 'user.test.ts' })) {
 *   // Returns true - skip validation for test files
 * }
 * if (shouldExcludeFileFromProjectStructureRulesGuard({ filename: '/src/brokers/user-broker.ts' })) {
 *   // Returns false - validate this file
 * }
 *
 * WHEN-TO-USE: Early filtering before applying project structure rules
 * WHEN-NOT-TO-USE: Files with multiple dots (.test.ts, .stub.ts) are excluded EXCEPT .proxy.ts files
 */
import { hasFileSuffixGuard } from '../has-file-suffix/has-file-suffix-guard';

export const shouldExcludeFileFromProjectStructureRulesGuard = ({
  filename,
}: {
  filename?: string | undefined;
}): boolean => {
  if (filename === undefined) {
    return true;
  }

  const fileBaseName = filename.split('/').pop() ?? '';

  // Allow .proxy.ts files through (they need validation)
  if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
    // Don't exclude - continue to other checks
  } else {
    // Exclude files with multiple dots (.test.ts, .stub.ts, .d.ts, etc.)
    const dotCount = (fileBaseName.match(/\./gu) ?? []).length;
    if (dotCount > 1) {
      return true;
    }
  }

  // Exclude test temp files (integration test fixtures)
  if (filename.includes('/.test-tmp/')) {
    return true;
  }

  // Exclude files not in /src/ or src/ (handle both absolute and relative paths)
  const isInSrcFolder = filename.includes('/src/') || filename.startsWith('src/');
  if (!isInSrcFolder) {
    return true;
  }

  // Extract path after src/ (handle both /src/ and src/ prefixes)
  const srcMatch = /(?:^|\/)(src\/.+)$/u.exec(filename);
  const pathAfterSrc = srcMatch?.[1]?.replace(/^src\//u, '');

  if (pathAfterSrc === undefined || pathAfterSrc === '') {
    return true;
  }

  // Exclude files directly in /src/ (index.ts, main.ts, etc.)
  if (!pathAfterSrc.includes('/')) {
    return true;
  }

  return false;
};
