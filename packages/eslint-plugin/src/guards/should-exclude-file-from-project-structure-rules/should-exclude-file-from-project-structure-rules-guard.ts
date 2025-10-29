import { hasFileSuffixGuard } from '../has-file-suffix/has-file-suffix-guard';

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

  // Exclude files not in /src/
  const isInSrcFolder = filename.includes('/src/');
  if (!isInSrcFolder) {
    return true;
  }

  const [, pathAfterSrc] = filename.split('/src/');
  if (pathAfterSrc === undefined || pathAfterSrc === '') {
    return true;
  }

  // Exclude files directly in /src/ (index.ts, main.ts, etc.)
  if (!pathAfterSrc.includes('/')) {
    return true;
  }

  return false;
};
