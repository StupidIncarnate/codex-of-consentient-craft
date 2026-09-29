/**
 * PURPOSE: Recovers the repo root from the path of a workspace package's source file, by cutting at
 * the `packages/<name>/src/` (or `packages/@scope/<name>/src/`) segment that holds it. Reach for
 * this when a lint rule knows only the file it was handed and must find the tree around it.
 *
 * USAGE:
 * repoRootFromSourcePathTransformer({ filePath: '/repo/packages/a/src/x/x-contract.ts' });
 * // Returns '/repo', or undefined when the path is not under a package's `src/`
 */
import { absoluteFilePathContract } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';

const PACKAGE_SOURCE_PATTERN = /^(?<root>\/.*?)\/packages\/(?:@[^/]+\/)?[^/]+\/src\//u;

export const repoRootFromSourcePathTransformer = ({
  filePath,
}: {
  filePath: string;
}): AbsoluteFilePath | undefined => {
  const root = PACKAGE_SOURCE_PATTERN.exec(filePath)?.groups?.root;
  return root === undefined ? undefined : absoluteFilePathContract.parse(root);
};
