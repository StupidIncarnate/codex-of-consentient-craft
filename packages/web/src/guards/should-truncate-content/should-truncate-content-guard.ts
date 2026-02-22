/**
 * PURPOSE: Checks if content exceeds truncation thresholds by character count or line count
 *
 * USAGE:
 * shouldTruncateContentGuard({content: 'a very long string...'});
 * // Returns true if content exceeds 200 chars or 8 lines
 */

import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';

export const shouldTruncateContentGuard = ({ content }: { content?: string }): boolean => {
  if (content === undefined) {
    return false;
  }

  if (content.length > contentTruncationConfigStatics.charLimit) {
    return true;
  }

  const lineCount = content.split('\n').length;

  return lineCount > contentTruncationConfigStatics.lineLimit;
};
