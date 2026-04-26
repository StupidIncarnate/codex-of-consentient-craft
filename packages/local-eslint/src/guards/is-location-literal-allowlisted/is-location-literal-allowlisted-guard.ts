/**
 * PURPOSE: Determines if a filename is in the no-bare-location-literals allowlist (locations statics, locations resolver brokers, tests/stubs/proxies/harnesses) and should NOT fire the rule.
 *
 * USAGE:
 * isLocationLiteralAllowlistedGuard({ filename: '/repo/packages/shared/src/statics/locations/locations-statics.ts' })
 * // Returns true
 * isLocationLiteralAllowlistedGuard({ filename: '/repo/packages/web/src/widgets/foo/foo-widget.ts' })
 * // Returns false
 *
 * WHEN-TO-USE: Only inside the no-bare-location-literals rule broker.
 */
import { locationLiteralStatics } from '../../statics/location-literal/location-literal-statics';

export const isLocationLiteralAllowlistedGuard = ({ filename }: { filename?: string }): boolean => {
  if (filename === undefined || filename.length === 0) {
    // Synthetic / unknown path — treat as not allowlisted so the rule still fires on it.
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');

  const substringMatches = locationLiteralStatics.allowlistPathSubstrings.some((needle) =>
    normalized.includes(needle),
  );
  if (substringMatches) {
    return true;
  }

  return locationLiteralStatics.allowlistPathRegexSources.some((source) =>
    new RegExp(source, 'u').test(normalized),
  );
};
