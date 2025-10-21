/**
 * Checks if an import source is an npm package.
 * Returns false for relative paths, absolute paths, and @questmaestro workspace packages.
 * Returns true for node: built-ins, scoped packages, and other npm packages.
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
