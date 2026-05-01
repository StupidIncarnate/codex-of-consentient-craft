/**
 * PURPOSE: Extracts the flow group name from a flow file absolute path by reading the
 * directory segment immediately after the `flows/` segment.
 *
 * USAGE:
 * flowGroupFromFilePathTransformer({
 *   filePath: absoluteFilePathContract.parse('/repo/packages/server/src/flows/quest/quest-flow.ts'),
 * });
 * // Returns ContentText 'quest'
 *
 * WHEN-TO-USE: http-backend headline renderer building the flow-grouped Routes section header
 * WHEN-NOT-TO-USE: When the path may not contain a `flows/` segment
 */

import type { AbsoluteFilePath } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../contracts/content-text/content-text-contract';

export const flowGroupFromFilePathTransformer = ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): ContentText => {
  const parts = String(filePath).split('/');
  const flowsIdx = parts.lastIndexOf('flows');
  if (flowsIdx !== -1 && parts[flowsIdx + 1] !== undefined) {
    return contentTextContract.parse(parts[flowsIdx + 1] ?? '');
  }
  return contentTextContract.parse('');
};
