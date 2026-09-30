/**
 * PURPOSE: Truncates content at character or line thresholds for display
 *
 * USAGE:
 * truncateContentTransformer({content: 'very long content...'});
 * // Returns truncated string at 200 chars or 8 lines, whichever comes first
 */

import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';

export const truncateContentTransformer = ({ content }: { content: string }): string => {
  const lines = content.split('\n');

  if (lines.length > contentTruncationConfigStatics.lineLimit) {
    return lines.slice(0, contentTruncationConfigStatics.lineLimit).join('\n');
  }

  return content.slice(0, contentTruncationConfigStatics.charLimit);
};
