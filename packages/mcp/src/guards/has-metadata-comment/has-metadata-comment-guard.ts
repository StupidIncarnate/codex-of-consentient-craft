/**
 * PURPOSE: Check if file contents contain the required metadata comment structure (PURPOSE, USAGE)
 *
 * USAGE:
 * const hasMetadata = hasMetadataCommentGuard({ fileContents: '/** PURPOSE: ... USAGE: ... *\/' });
 * // Returns true if all required sections are present
 */

export const hasMetadataCommentGuard = ({ fileContents }: { fileContents?: string }): boolean => {
  if (!fileContents) {
    return false;
  }

  // Check for PURPOSE, USAGE
  const hasPurpose = /\/\*\*\s*\n\s*\*\s*PURPOSE:/u.test(fileContents);
  const hasUsage = /\*\s*USAGE:/u.test(fileContents);

  return hasPurpose && hasUsage;
};
