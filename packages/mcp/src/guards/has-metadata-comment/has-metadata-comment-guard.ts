/**
 * PURPOSE: Check if file contents contain the required metadata comment structure (PURPOSE, USAGE)
 *
 * USAGE:
 * const hasMetadata = hasMetadataCommentGuard({ fileContents: FileContentsStub({ value: '/** PURPOSE: ... USAGE: ... *\/' }) });
 * // Returns true if all required sections are present
 */

import type { FileContents } from '../../contracts/file-contents/file-contents-contract';

export const hasMetadataCommentGuard = ({
  fileContents,
}: {
  fileContents?: FileContents;
}): boolean => {
  if (!fileContents) {
    return false;
  }

  // Check for PURPOSE, USAGE
  const hasPurpose = /\/\*\*\s*\n\s*\*\s*PURPOSE:/u.test(fileContents);
  const hasUsage = /\*\s*USAGE:/u.test(fileContents);

  return hasPurpose && hasUsage;
};
