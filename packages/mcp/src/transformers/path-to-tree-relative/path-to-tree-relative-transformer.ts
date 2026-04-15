/**
 * PURPOSE: Computes a tree-display-relative path that preserves package identity so cross-package results do not collide
 *
 * USAGE:
 * pathToTreeRelativeTransformer({ filepath: PathSegmentStub({ value: '/mono/packages/hooks/src/adapters/fs/write-file/fs-write-file-adapter.ts' }) });
 * // Returns 'hooks/adapters/fs/write-file/fs-write-file-adapter.ts' (monorepo: package name prepended, src/ stripped)
 *
 * WHEN-TO-USE: When building a discover tree so the same relative path under two different packages renders as distinct roots
 */

import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

const PACKAGES_SRC_PATTERN = /(?:^|\/)packages\/([^/]+)\/src\//u;
const SCOPED_ALIAS_SRC_PATTERN = /(?:^|\/)(@[^/]+\/[^/]+)\/src\//u;
const SRC_SEGMENT = '/src/';

export const pathToTreeRelativeTransformer = ({
  filepath,
}: {
  filepath: PathSegment;
}): PathSegment => {
  const pathStr = String(filepath);

  // Monorepo: /.../packages/<pkg>/src/... → <pkg>/...
  const pkgMatch = PACKAGES_SRC_PATTERN.exec(pathStr);
  if (pkgMatch) {
    const pkgName = pkgMatch[1] ?? '';
    const afterSrc = pathStr.slice(pkgMatch.index + pkgMatch[0].length);
    return pathSegmentContract.parse(`${pkgName}/${afterSrc}`);
  }

  // Scoped alias: @dungeonmaster/shared/src/... → @dungeonmaster/shared/...
  const scopedMatch = SCOPED_ALIAS_SRC_PATTERN.exec(pathStr);
  if (scopedMatch) {
    const pkgName = scopedMatch[1] ?? '';
    const afterSrc = pathStr.slice(scopedMatch.index + scopedMatch[0].length);
    return pathSegmentContract.parse(`${pkgName}/${afterSrc}`);
  }

  // Single-package repo: /.../src/... → strip to after last /src/
  const srcIndex = pathStr.lastIndexOf(SRC_SEGMENT);
  if (srcIndex >= 0) {
    return pathSegmentContract.parse(pathStr.slice(srcIndex + SRC_SEGMENT.length));
  }

  // Relative path starting with `src/`  → strip the leading `src/`
  if (pathStr.startsWith('src/')) {
    return pathSegmentContract.parse(pathStr.slice('src/'.length));
  }

  // No recognizable anchor — return as-is
  return filepath;
};
