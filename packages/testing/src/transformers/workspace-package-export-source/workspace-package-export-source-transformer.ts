/**
 * PURPOSE: Matches a subpath against a workspace package's own `exports` map the way Node's
 * pattern-export resolution does — an exact literal key first, then the best-matching wildcard key
 * by Node's own PATTERN_KEY_COMPARE: the key with the longer prefix before its `*` wins, and on a
 * tie (`./*.proxy` vs `./*.stub` vs `./*`, every one's prefix is the empty string before `*`) the
 * longer WHOLE key wins. That tie is real here — a gateway package's four keys share the "./"
 * prefix — so comparison must be order-independent: reading `./*` before `./*.proxy` in the
 * package.json must still pick `./*.proxy` for a path ending in `.proxy`. Substitutes the captured
 * remainder for every star in the winning key's `source` target.
 *
 * USAGE:
 * workspacePackageExportSourceTransformer({
 *   exportsMap: WorkspacePackageJsonStub({ exports: { './git': { source: './src/git/git.ts' } } }).exports,
 *   subpath: PackageSpecifierPartsStub({}).subpath,
 * });
 * // Returns the matched entry's branded source path, or null
 */

import type { WorkspacePackageJson } from '../../contracts/workspace-package-json/workspace-package-json-contract';
import type { PackageSpecifierParts } from '../../contracts/package-specifier-parts/package-specifier-parts-contract';

const KEY_PREFIX_LENGTH = './'.length;

export const workspacePackageExportSourceTransformer = ({
  exportsMap,
  subpath,
}: {
  exportsMap: WorkspacePackageJson['exports'];
  subpath: PackageSpecifierParts['subpath'];
}): string | null => {
  if (!exportsMap) {
    return null;
  }

  // Object.entries always yields plain string keys, even off a branded-key Record, so the literal
  // key comparison below stays a `===` rather than indexing exportsMap by a constructed key.
  const literalKey = `./${subpath}`;
  let wildcardMatch: string | null = null;
  let wildcardPrefixLength = -1;
  let wildcardKeyLength = -1;

  // Node's PATTERN_KEY_COMPARE: the key with the longer prefix before `*` wins; on a tie, the
  // longer WHOLE key wins. Both comparisons are `>` (never `>=`), so encountering an equally
  // specific key later in iteration order never displaces the current best match — the result
  // does not depend on which order the map lists its keys in.
  for (const [key, entry] of Object.entries(exportsMap)) {
    // A bare string entry (`"./jest-config-base": "./jest-config-base.js"`) IS its own source —
    // Node's shorthand for "every condition resolves here", no conditions object at all.
    const source = typeof entry === 'string' ? entry : entry.source;
    if (!source) {
      continue;
    }
    if (key === literalKey) {
      return source;
    }

    const starIndex = key.indexOf('*');
    if (starIndex === -1) {
      continue;
    }

    const prefix = key.slice(KEY_PREFIX_LENGTH, starIndex);
    const suffix = key.slice(starIndex + 1);
    const longEnough = subpath.length >= prefix.length + suffix.length;
    if (!longEnough || !subpath.startsWith(prefix) || !subpath.endsWith(suffix)) {
      continue;
    }

    const isMoreSpecific =
      prefix.length > wildcardPrefixLength ||
      (prefix.length === wildcardPrefixLength && key.length > wildcardKeyLength);
    if (!isMoreSpecific) {
      continue;
    }

    const captured = subpath.slice(prefix.length, subpath.length - suffix.length);
    wildcardMatch = source.replaceAll('*', captured);
    wildcardPrefixLength = prefix.length;
    wildcardKeyLength = key.length;
  }

  return wildcardMatch;
};
