/**
 * PURPOSE: Checks if an import source is an npm package, returning false for relative paths, absolute paths, and @dungeonmaster workspace packages. A gateway subpath (`@dungeonmaster/node/fs`, `@dungeonmaster/npm/zod`, …) counts as mockable too — its whole job is wrapping an outside thing, so a caller's proxy mocking it directly is mocking the real I/O boundary, the same as mocking `@dungeonmaster/shared/adapters`.
 *
 * USAGE:
 * isNpmPackageGuard({ importSource: 'eslint' })
 * // Returns true for npm packages (including node: built-ins and scoped packages), false for relative/absolute paths and @dungeonmaster packages
 * isNpmPackageGuard({ importSource: '@dungeonmaster/node/fs' })
 * // Returns true — a gateway subpath is a mockable I/O boundary
 */
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

export const isNpmPackageGuard = ({ importSource }: { importSource?: string }): boolean => {
  // Handle undefined/empty
  if (!importSource) {
    return false;
  }

  // Relative/absolute paths are not npm packages
  if (importSource.startsWith('.') || importSource.startsWith('/')) {
    return false;
  }

  // @dungeonmaster workspace packages are not npm packages for mocking purposes.
  // EXCEPTIONS: @dungeonmaster/shared/adapters (language primitives like import()), and any
  // subpath of a gateway package — the gateway IS the I/O boundary, so mocking its subpath
  // directly is exactly what a caller's proxy is supposed to do.
  if (importSource.startsWith('@dungeonmaster')) {
    if (importSource === '@dungeonmaster/shared/adapters') {
      return true;
    }

    const afterScope = importSource.slice('@dungeonmaster/'.length);
    const [gatewayFolder] = afterScope.split('/');

    return Object.values(gatewayLocationsStatics.folders).some(
      (folder) => folder === gatewayFolder,
    );
  }

  // Everything else is an npm package (including node:, scoped packages, etc.)
  return true;
};
