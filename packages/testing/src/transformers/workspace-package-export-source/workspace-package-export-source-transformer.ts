/**
 * PURPOSE: Matches a subpath against a workspace package's own `exports` map the way Node's
 * pattern-export resolution does — an exact literal key first, then the single-star wildcard key
 * with the longest prefix, substituting the captured remainder for every star in that key's
 * `source` target. Resolves `@dungeonmaster/bin/git` against a wildcard `"./" + star` export key
 * whose `source` is `"./src/" + star + "/" + star + ".ts"`, without needing that package built —
 * the same answer Node's own `exports` "source" condition would give.
 *
 * USAGE:
 * workspacePackageExportSourceTransformer({
 *   exportsMap: WorkspacePackageJsonStub({ exports: { './git': { source: './src/git/git.ts' } } }).exports,
 *   subpath: PackageSpecifierPartsStub({}).subpath,
 * });
 * // Returns the matched entry's branded source path, or null
 */

import { workspacePackageExportSourcePathContract } from '../../contracts/workspace-package-export-source-path/workspace-package-export-source-path-contract';
import type { WorkspacePackageExportSourcePath } from '../../contracts/workspace-package-export-source-path/workspace-package-export-source-path-contract';
import type { WorkspacePackageJson } from '../../contracts/workspace-package-json/workspace-package-json-contract';
import type { PackageSpecifierParts } from '../../contracts/package-specifier-parts/package-specifier-parts-contract';

const KEY_PREFIX_LENGTH = './'.length;

export const workspacePackageExportSourceTransformer = ({
  exportsMap,
  subpath,
}: {
  exportsMap: WorkspacePackageJson['exports'];
  subpath: PackageSpecifierParts['subpath'];
}): WorkspacePackageExportSourcePath | null => {
  if (!exportsMap) {
    return null;
  }

  // Object.entries always yields plain string keys, even off a branded-key Record, so the literal
  // key comparison below stays a `===` rather than indexing exportsMap by a constructed key.
  const literalKey = `./${subpath}`;
  let wildcardMatch: WorkspacePackageExportSourcePath | null = null;
  let wildcardPrefixLength = -1;

  // Node picks the wildcard key with the LONGEST prefix, whatever order the map lists them in —
  // `./_test_/*` beats `./*` for `_test_/fs`. Every `*` in the target takes the captured text.
  for (const [key, entry] of Object.entries(exportsMap)) {
    // A bare string entry (`"./jest-config-base": "./jest-config-base.js"`) IS its own source —
    // Node's shorthand for "every condition resolves here", no conditions object at all.
    const source = typeof entry === 'string' ? entry : entry?.source;
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
    if (
      longEnough &&
      prefix.length > wildcardPrefixLength &&
      subpath.startsWith(prefix) &&
      subpath.endsWith(suffix)
    ) {
      const captured = subpath.slice(prefix.length, subpath.length - suffix.length);
      wildcardMatch = workspacePackageExportSourcePathContract.parse(
        source.replaceAll('*', captured),
      );
      wildcardPrefixLength = prefix.length;
    }
  }

  return wildcardMatch;
};
