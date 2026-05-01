/**
 * PURPOSE: Returns false when a file path ends with any test/proxy/stub suffix from projectMapStatics; true otherwise.
 *
 * USAGE:
 * isNonTestFileGuard({ filePath });
 * // Returns false for `.test.ts`, `.test.tsx`, `.proxy.ts`, `.proxy.tsx`, `.stub.ts`, `.integration.test.ts`
 *
 * WHEN-TO-USE: Centralized filter for project-map extractors (boot-tree, edge-graph, state-writes, widget-tree,
 * headline renderers, package-inventory) so the test-file filter cannot drift across extractors.
 */

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';

export const isNonTestFileGuard = ({ filePath }: { filePath?: AbsoluteFilePath }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  for (const suffix of projectMapStatics.testFileSuffixes) {
    if (filePath.endsWith(suffix)) {
      return false;
    }
  }
  return true;
};
