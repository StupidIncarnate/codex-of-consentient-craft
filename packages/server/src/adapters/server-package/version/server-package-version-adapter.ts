/**
 * PURPOSE: Reach for this over webBundleDistPathAdapter — the package's other
 * require.resolve-based adapter — when the caller needs the manifest's CONTENT rather than
 * confirming a sibling path exists. That adapter swallows a missing web bundle to null because
 * the bundle is optional; this one throws because a health snapshot without a version string is
 * not a valid snapshot, and GET /api/health needs a real failure path to report.
 *
 * USAGE:
 * const version = serverPackageVersionAdapter();
 * // PackageVersion, e.g. '0.1.0'
 */
import { readFileSync } from 'fs';
import { serverPackageJsonContract } from '../../../contracts/server-package-json/server-package-json-contract';
import type { ServerPackageJson } from '../../../contracts/server-package-json/server-package-json-contract';

const SERVER_PACKAGE_JSON_SPECIFIER = '@dungeonmaster/server/package.json';

export const serverPackageVersionAdapter = (): ServerPackageJson['version'] => {
  try {
    const raw = readFileSync(require.resolve(SERVER_PACKAGE_JSON_SPECIFIER), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    const { version } = serverPackageJsonContract.parse(parsed);
    return version;
  } catch (error: unknown) {
    throw new Error(`Failed to read ${SERVER_PACKAGE_JSON_SPECIFIER} version: ${String(error)}`, {
      cause: error,
    });
  }
};
