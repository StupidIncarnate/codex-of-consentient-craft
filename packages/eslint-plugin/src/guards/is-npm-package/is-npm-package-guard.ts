/**
 * PURPOSE: Checks if an import source is an npm package, returning false for relative paths, absolute paths, and @dungeonmaster workspace packages. A gateway subpath (`@dungeonmaster/node/fs`, `@dungeonmaster/npm/zod`, `#gateway/node/fs`, …) counts as mockable too — its whole job is wrapping an outside thing, so a caller's proxy mocking it directly is mocking the real I/O boundary, the same as mocking `@dungeonmaster/shared/adapters`. The `#gateway/<folder>` import-alias form (gatewayLocationsStatics.importPrefix) gets its own branch rather than falling into the generic npm-package default at the bottom — it is never a real npm package, so it must resolve through the gateway carve-out or return false, the same as an unrecognized `@dungeonmaster/*` workspace path does.
 *
 * USAGE:
 * isNpmPackageGuard({ importSource: 'eslint' })
 * // Returns true for npm packages (including node: built-ins and scoped packages), false for relative/absolute paths and @dungeonmaster packages
 * isNpmPackageGuard({ importSource: '@dungeonmaster/node/fs' })
 * // Returns true — a gateway subpath is a mockable I/O boundary
 * isNpmPackageGuard({ importSource: '#gateway/node/fs' })
 * // Returns true — the import-alias form of the same gateway subpath
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

  // The '#gateway/<folder>' import-alias form is never a real npm package — it always names one
  // of the four gateway packages, so it is mockable exactly like the '@dungeonmaster/<folder>'
  // form below, and never falls through to the generic npm-package default.
  if (importSource.startsWith(`${gatewayLocationsStatics.importPrefix}/`)) {
    const afterPrefix = importSource.slice(`${gatewayLocationsStatics.importPrefix}/`.length);
    const [gatewayFolder] = afterPrefix.split('/');

    return Object.values(gatewayLocationsStatics.folders).some(
      (folder) => folder === gatewayFolder,
    );
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
