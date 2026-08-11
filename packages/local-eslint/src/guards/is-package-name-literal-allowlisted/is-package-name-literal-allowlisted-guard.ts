/**
 * PURPOSE: Determines if a filename is in the no-hardcoded-package-names allowlist (the rule's own package, plus tests/stubs/proxies/harnesses) and should NOT fire the rule.
 *
 * USAGE:
 * isPackageNameLiteralAllowlistedGuard({ filename: '/repo/packages/web/src/widgets/foo/foo-widget.test.ts' })
 * // Returns true
 * isPackageNameLiteralAllowlistedGuard({ filename: '/repo/packages/shared/src/brokers/foo/foo-broker.ts' })
 * // Returns false
 *
 * WHEN-TO-USE: Only inside the no-hardcoded-package-names rule broker.
 */
import { packageNameLiteralStatics } from '../../statics/package-name-literal/package-name-literal-statics';

export const isPackageNameLiteralAllowlistedGuard = ({
  filename,
}: {
  filename?: string;
}): boolean => {
  if (filename === undefined || filename.length === 0) {
    // Synthetic / unknown path — treat as not allowlisted so the rule still fires on it.
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');

  const substringMatches = packageNameLiteralStatics.allowlistPathSubstrings.some((needle) =>
    normalized.includes(needle),
  );
  if (substringMatches) {
    return true;
  }

  return packageNameLiteralStatics.allowlistPathRegexSources.some((source) =>
    new RegExp(source, 'u').test(normalized),
  );
};
