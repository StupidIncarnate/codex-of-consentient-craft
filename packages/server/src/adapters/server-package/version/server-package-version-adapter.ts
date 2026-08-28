/**
 * PURPOSE: Reads the version field off @dungeonmaster/server's own package.json at runtime, so the
 * health badge reports the version actually running rather than one pinned in a statics file that
 * goes stale at the next release. Unlike its sibling webBundleDistPathAdapter, this one throws
 * instead of returning a fallback — a badge showing a wrong version is worse than a request failing.
 *
 * USAGE:
 * const version = serverPackageVersionAdapter();
 * // Returns ServerVersion read live from the server package's own package.json
 */
import { readFileSync } from 'fs';
import { serverVersionContract } from '../../../contracts/server-version/server-version-contract';
import type { ServerVersion } from '../../../contracts/server-version/server-version-contract';

const PACKAGE_JSON_SUBPATH = '@dungeonmaster/server/package.json';

export const serverPackageVersionAdapter = (): ServerVersion => {
  try {
    const packageJsonPath = require.resolve(PACKAGE_JSON_SUBPATH);
    const raw = readFileSync(packageJsonPath, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    const version =
      typeof parsed === 'object' && parsed !== null && 'version' in parsed
        ? (parsed as Record<'version', unknown>).version
        : undefined;

    return serverVersionContract.parse(version);
  } catch (error) {
    throw new Error(
      `serverPackageVersionAdapter: failed to read version from ${PACKAGE_JSON_SUBPATH}: ${String(error)}`,
      { cause: error },
    );
  }
};
