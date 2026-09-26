/**
 * PURPOSE: Matches a `#`-specifier against a package's own `imports` map the way Node's
 * subpath-imports pattern resolution does — an exact literal key first, then a single-star
 * wildcard key, substituting the captured remainder into the matched key's target. Honors a
 * conditions-object target by picking `source` first (this repo's own resolution condition, ahead
 * of Node's real runtime conditions), then `import`/`require`/`default` — the precedence
 * workspacePackageExportSourceTransformer's `source`-only lookup doesn't need on the `exports` side
 * because that map only ever carries this repo's own `source` condition.
 *
 * USAGE:
 * workspacePackageImportsTargetTransformer({
 *   importsMap: { '#gateway/npm/*': '@dungeonmaster/npm/*' },
 *   specifier: importPathContract.parse('#gateway/npm/_test_'),
 * });
 * // Returns '@dungeonmaster/npm/_test_' as branded ImportPath, or null
 */

import { importPathContract } from '../../contracts/import-path/import-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';
import type { WorkspacePackageJson } from '../../contracts/workspace-package-json/workspace-package-json-contract';

export const workspacePackageImportsTargetTransformer = ({
  importsMap,
  specifier,
}: {
  importsMap: WorkspacePackageJson['imports'];
  specifier: ImportPath;
}): ImportPath | null => {
  if (!importsMap) {
    return null;
  }

  let wildcardMatch: ImportPath | null = null;

  // Object.entries always yields plain string keys, even off a branded-key Record, so the literal
  // key comparison below stays a `===` rather than indexing importsMap by a constructed key.
  for (const [key, value] of Object.entries(importsMap)) {
    const target =
      typeof value === 'string'
        ? value
        : (value?.source ?? value?.import ?? value?.require ?? value?.default);
    if (!target) {
      continue;
    }
    if (key === specifier) {
      return target;
    }
    if (wildcardMatch) {
      continue;
    }

    const starIndex = key.indexOf('*');
    if (starIndex === -1) {
      continue;
    }

    const prefix = key.slice(0, starIndex);
    const suffix = key.slice(starIndex + 1);
    const longEnough = specifier.length >= prefix.length + suffix.length;
    if (longEnough && specifier.startsWith(prefix) && specifier.endsWith(suffix)) {
      const captured = specifier.slice(prefix.length, specifier.length - suffix.length);
      wildcardMatch = importPathContract.parse(target.replace('*', captured));
    }
  }

  return wildcardMatch;
};
