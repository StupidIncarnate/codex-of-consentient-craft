/**
 * PURPOSE: Returns the monorepo package name for an absolute file path under
 * `<root>/packages/<pkg>/...`, or null when the path is not under any packages directory.
 *
 * USAGE:
 * packageOfAbsoluteFilePathTransformer({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/responders/x.ts'),
 * });
 * // Returns ContentText 'server'
 *
 * packageOfAbsoluteFilePathTransformer({
 *   filePath: absoluteFilePathContract.parse('/some/other/path.ts'),
 * });
 * // Returns null
 *
 * WHEN-TO-USE: Edge-graph aggregators grouping edges by source/destination package
 */

import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';

const PACKAGES_DIR_PATTERN = /\/packages\/([^/]+)\//u;

export const packageOfAbsoluteFilePathTransformer = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ContentText | null => {
  const match = PACKAGES_DIR_PATTERN.exec(String(filePath));
  if (match === null) return null;
  const [, pkg] = match;
  if (pkg === undefined) return null;
  return contentTextContract.parse(pkg);
};
