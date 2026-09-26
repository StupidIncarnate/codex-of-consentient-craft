/**
 * PURPOSE: Matches a subpath against a workspace package's own `exports` map the way Node's
 * pattern-export resolution does — an exact literal key first, then a single-star wildcard key,
 * substituting the captured remainder into the matched key's `source` target. Resolves
 * `@dungeonmaster/bin/testing` against a wildcard `"./" + star` export key whose `source` is
 * `"./src/" + star + "/index.ts"`, without needing that package built — the same answer Node's own
 * `exports` "source" condition would give.
 *
 * USAGE:
 * workspacePackageExportSourceTransformer({
 *   exportsMap: WorkspacePackageJsonStub({ exports: { './git': { source: './src/git/index.ts' } } }).exports,
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

  for (const [key, entry] of Object.entries(exportsMap)) {
    if (!entry?.source) {
      continue;
    }
    if (key === literalKey) {
      return entry.source;
    }
    if (wildcardMatch) {
      continue;
    }

    const starIndex = key.indexOf('*');
    if (starIndex === -1) {
      continue;
    }

    const prefix = key.slice(KEY_PREFIX_LENGTH, starIndex);
    const suffix = key.slice(starIndex + 1);
    const longEnough = subpath.length >= prefix.length + suffix.length;
    if (longEnough && subpath.startsWith(prefix) && subpath.endsWith(suffix)) {
      const captured = subpath.slice(prefix.length, subpath.length - suffix.length);
      wildcardMatch = workspacePackageExportSourcePathContract.parse(
        entry.source.replace('*', captured),
      );
    }
  }

  return wildcardMatch;
};
