/**
 * PURPOSE: Node's own `require.resolve` of a module specifier, answering `null` when the module is
 * not installed. Only "not found" is "not installed" — any other failure (a broken `exports` map,
 * an invalid specifier) still throws. `fromDir` starts Node's `node_modules` walk there; without it
 * the walk starts from this process's own install. Reach for this over `resolvePackageRoot` when
 * the question is the resolved FILE rather than the package root.
 *
 * USAGE:
 * resolveModuleIfExists({ specifier: '@dungeonmaster/cli/package.json', fromDir: '/repo' });
 * // Returns the absolute path of the resolved file, or null when nothing resolves
 *
 * Node reports "not found" as code MODULE_NOT_FOUND; Jest's patched `require.resolve` carries no
 * code and says "Cannot resolve module ..." instead, so both spellings count.
 */

export const resolveModuleIfExists = ({
  specifier,
  fromDir,
}: {
  specifier: string;
  fromDir?: string;
}): string | null => {
  try {
    return fromDir === undefined
      ? require.resolve(specifier)
      : require.resolve(specifier, { paths: [fromDir] });
  } catch (error: unknown) {
    // Duck-typed, never `instanceof Error`: under Jest the resolver's errors come from another realm.
    const isNotFound =
      typeof error === 'object' &&
      error !== null &&
      (('code' in error && error.code === 'MODULE_NOT_FOUND') ||
        ('message' in error &&
          typeof error.message === 'string' &&
          /^Cannot (?:find|resolve) module /u.test(error.message)));
    if (isNotFound) {
      return null;
    }
    throw error;
  }
};
