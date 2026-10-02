/**
 * PURPOSE: Decides whether a filename is exempt from ban-ambient-module-resolve: the one sanctioned
 * resolve broker, the gateway packages, and tests/stubs/proxies/harnesses.
 *
 * USAGE:
 * isBanAmbientModuleResolveExemptFileGuard({ filename: '/repo/packages/cli/src/brokers/a/b/a-b-broker.ts' })
 * // Returns false
 *
 * WHEN-TO-USE: Only inside the ban-ambient-module-resolve rule broker.
 */
import { banAmbientModuleResolveStatics } from '../../statics/ban-ambient-module-resolve/ban-ambient-module-resolve-statics';

export const isBanAmbientModuleResolveExemptFileGuard = ({
  filename,
}: {
  filename?: string;
}): boolean => {
  if (filename === undefined || filename.length === 0) {
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');

  if (normalized.includes(banAmbientModuleResolveStatics.sanctionedPathSubstring)) {
    return true;
  }

  if (
    banAmbientModuleResolveStatics.exemptPathSubstrings.some((needle) =>
      normalized.includes(needle),
    )
  ) {
    return true;
  }

  return banAmbientModuleResolveStatics.exemptPathRegexSources.some((source) =>
    new RegExp(source, 'u').test(normalized),
  );
};
