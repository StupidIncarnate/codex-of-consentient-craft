/**
 * PURPOSE: Checks if an import source is an npm package, returning false for relative paths, absolute paths, and @dungeonmaster workspace packages.
 *
 * USAGE:
 * isNpmPackageGuard({ importSource: 'eslint' })
 * // Returns true for npm packages (including node: built-ins and scoped packages), false for relative/absolute paths and @dungeonmaster packages
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

  // @dungeonmaster workspace packages are not npm packages for mocking purposes
  // EXCEPTION: @dungeonmaster/shared/adapters exports can be mocked (for language primitives like import())
  if (importSource.startsWith('@dungeonmaster')) {
    return importSource === '@dungeonmaster/shared/adapters';
  }

  // Everything else is an npm package (including node:, scoped packages, etc.)
  return true;
};
