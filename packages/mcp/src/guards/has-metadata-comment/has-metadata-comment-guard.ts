/**
 * PURPOSE: Check if file contents contain the required metadata comment structure (PURPOSE, USAGE, RELATED)
 *
 * USAGE:
 * const hasMetadata = hasMetadataCommentGuard({ fileContents: FileContentsStub({ value: '/** PURPOSE: ... USAGE: ... RELATED: ... *\/' }) });
 * // Returns true if all required sections are present
 *
 * RELATED: metadata-extractor-transformer
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

  // Check for PURPOSE, USAGE, RELATED
  const hasPurpose = /\/\*\*\s*\n\s*\*\s*PURPOSE:/u.test(fileContents);
  const hasUsage = /\*\s*USAGE:/u.test(fileContents);
  const hasRelated = /\*\s*RELATED:/u.test(fileContents);

  return hasPurpose && hasUsage && hasRelated;
};
