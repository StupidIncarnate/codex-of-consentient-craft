/**
 * Determines if a file should be excluded from project structure rule validation.
 * Excludes:
 * - Files with multiple dots (.test.ts, .stub.ts, .d.ts, etc.)
 * - EXCEPT .proxy.ts files (these are validated)
 * - Files not in /src/ directory
 * - Files directly in /src/ (like index.ts, main.ts)
 *
 * Use case: Early filtering for all project structure ESLint rules
 */
export const shouldExcludeFileFromProjectStructureRulesGuard = ({
  filename,
}: {
  filename: string;
}): boolean => {
  const fileBaseName = filename.split('/').pop() ?? '';

  // Allow .proxy.ts files through (they need validation)
  if (fileBaseName.endsWith('.proxy.ts')) {
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
