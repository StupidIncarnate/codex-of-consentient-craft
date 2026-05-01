/**
 * PURPOSE: Returns true when a file path ends with a TypeScript or JavaScript source extension
 *
 * USAGE:
 * isSourceFileGuard({ filePath: absoluteFilePathContract.parse('/src/brokers/user/user-broker.ts') });
 * // Returns true for .ts, .tsx, .js, .jsx extensions; false otherwise
 *
 * WHEN-TO-USE: Filtering directory entries to select only source files (excluding JSON, markdown, etc.)
 * WHEN-NOT-TO-USE: When you need to distinguish between TypeScript and JavaScript files
 */

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import { projectMapStatics } from '../../statics/project-map/project-map-statics';

export const isSourceFileGuard = ({ filePath }: { filePath?: AbsoluteFilePath }): boolean => {
  if (filePath === undefined) {
    return false;
  }
  return projectMapStatics.sourceFileExtensions.some((ext) => filePath.endsWith(ext));
};
