/**
 * PURPOSE: Determines if a filename is in the ban-quest-status-literals allowlist (metadata/contracts/guards/prompt-statics/tests/stubs/proxies) and should NOT fire the rule
 *
 * USAGE:
 * isStatusComparisonAllowlistedGuard({ filename: '/repo/packages/web/src/widgets/foo/foo-widget.test.ts' })
 * // Returns true
 *
 * WHEN-TO-USE: Only inside the ban-quest-status-literals rule broker.
 */
import { statusLiteralStatics } from '../../statics/status-literal/status-literal-statics';

export const isStatusComparisonAllowlistedGuard = ({
  filename,
}: {
  filename?: string;
}): boolean => {
  if (filename === undefined || filename.length === 0) {
    // Synthetic / unknown path — treat as not allowlisted so the rule still fires on it.
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');

  const substringMatches = statusLiteralStatics.allowlistPathSubstrings.some((needle) =>
    normalized.includes(needle),
  );
  if (substringMatches) {
    return true;
  }

  return statusLiteralStatics.allowlistPathRegexSources.some((source) =>
    new RegExp(source, 'u').test(normalized),
  );
};
