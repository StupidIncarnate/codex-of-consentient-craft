/**
 * PURPOSE: Checks if an import source is an npm package, returning false for relative paths, absolute paths, and @questmaestro workspace packages.
 *
 * USAGE:
 * isNpmPackageGuard({ importSource: 'eslint' })
 * // Returns true for npm packages (including node: built-ins and scoped packages), false for relative/absolute paths and @questmaestro packages
 */
export const isNpmPackageGuard = ({ importSource }: { importSource?: string }): boolean => {
  // Handle undefined/empty
  if (!importSource) {
    return false;
  }

  // Relative/absolute paths are not npm packages
  if (importSource.startsWith('.') || importSource.startsWith('/')) {
    return false;
  }

  // @questmaestro workspace packages are not npm packages for mocking purposes
  if (importSource.startsWith('@questmaestro')) {
    return false;
  }

  // Everything else is an npm package (including node:, scoped packages, etc.)
  return true;
};
