/**
 * PURPOSE: Resolves the running @dungeonmaster/server package's own version string for the
 * health-status payload. Reach for this over reading packages/server/package.json inline at each
 * call site — the seed route and the heartbeat both need the same value — and a resolution or read
 * failure degrades to a placeholder rather than taking either down, mirroring
 * webBundleDistPathAdapter's degrade-on-failure shape for a sibling package.json resolution.
 *
 * USAGE:
 * const version = serverVersionReadAdapter();
 * // Returns the server's package.json "version" field, or 'unknown' when it cannot be resolved,
 * // read, or the field is absent
 */
import { readFileSync } from 'fs';
import { healthStatusPayloadContract } from '@dungeonmaster/shared/contracts';
import type { HealthStatusPayload } from '@dungeonmaster/shared/contracts';

const SERVER_PACKAGE_JSON_SPECIFIER = '@dungeonmaster/server/package.json';
const FALLBACK_VERSION = 'unknown';

export const serverVersionReadAdapter = (): HealthStatusPayload['version'] => {
  try {
    const packageJsonPath = require.resolve(SERVER_PACKAGE_JSON_SPECIFIER);
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as Record<
      PropertyKey,
      unknown
    >;
    const { version } = packageJson;

    if (typeof version === 'string' && version.length > 0) {
      return healthStatusPayloadContract.shape.version.parse(version);
    }

    return healthStatusPayloadContract.shape.version.parse(FALLBACK_VERSION);
  } catch {
    return healthStatusPayloadContract.shape.version.parse(FALLBACK_VERSION);
  }
};
