/**
 * PURPOSE: Decides whether a filename may call homedir()/tmpdir() bare — the OS adapter layer for
 * both, plus, for tmpdir() only, harnesses and each package's own playwright.config.ts (their
 * callers legitimately need the real OS tmp dir). homedir() gets no such exception: a harness or a
 * playwright.config.ts still routes a home read through an adapter.
 *
 * USAGE:
 * isOsHomeTmpAllowlistedGuard({ filename: '/repo/packages/shared/src/adapters/os/homedir/os-homedir-adapter.ts', kind: 'homedir' })
 * // Returns true
 * isOsHomeTmpAllowlistedGuard({ filename: '/repo/packages/web/test/harnesses/foo.harness.ts', kind: 'tmpdir' })
 * // Returns true
 * isOsHomeTmpAllowlistedGuard({ filename: '/repo/packages/web/test/harnesses/foo.harness.ts', kind: 'homedir' })
 * // Returns false
 *
 * WHEN-TO-USE: Only inside the ban-bare-os-home-tmp rule broker.
 */
import { banBareOsHomeTmpStatics } from '../../statics/ban-bare-os-home-tmp/ban-bare-os-home-tmp-statics';

export type OsHomeTmpKind = 'homedir' | 'tmpdir';

export const isOsHomeTmpAllowlistedGuard = ({
  filename,
  kind,
}: {
  filename?: string;
  kind?: OsHomeTmpKind;
}): boolean => {
  if (filename === undefined || filename.length === 0 || kind === undefined) {
    // Synthetic / unknown input — treat as not allowlisted so the rule still fires on it.
    return false;
  }

  const normalized = filename.replace(/\\/gu, '/');

  if (normalized.includes(banBareOsHomeTmpStatics.allowlist.adaptersPathSubstring)) {
    return true;
  }

  if (kind === 'homedir') {
    return false;
  }

  const substringMatches = banBareOsHomeTmpStatics.allowlist.tmpdirOnlyPathSubstrings.some(
    (needle) => normalized.includes(needle),
  );
  if (substringMatches) {
    return true;
  }

  return banBareOsHomeTmpStatics.allowlist.tmpdirOnlyPathRegexSources.some((source) =>
    new RegExp(source, 'u').test(normalized),
  );
};
