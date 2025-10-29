/**
 * PURPOSE: Checks if an import source is an npm package (not a relative/absolute path)
 *
 * USAGE:
 * if (isNpmPackageImportGuard({ importSource: 'lodash' })) {
 *   // Import is from an npm package
 * }
 * // Returns true if import doesn't start with '.' or '/' (includes workspace packages)
 */
export const isNpmPackageImportGuard = ({ importSource }: { importSource?: string }): boolean => {
  if (importSource === undefined || importSource === '') {
    return false;
  }

  // NPM package imports don't start with '.' or '..'
  return !importSource.startsWith('.') && !importSource.startsWith('/');
};
