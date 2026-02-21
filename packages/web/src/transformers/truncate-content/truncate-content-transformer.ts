/**
 * PURPOSE: Truncates content at character or line thresholds for display
 *
 * USAGE:
 * truncateContentTransformer({content: 'very long content...'});
 * // Returns truncated string at 200 chars or 8 lines, whichever comes first
 */

import { truncatedContentContract } from '../../contracts/truncated-content/truncated-content-contract';
import type { TruncatedContent } from '../../contracts/truncated-content/truncated-content-contract';
import { contentTruncationConfigStatics } from '../../statics/content-truncation-config/content-truncation-config-statics';

export const truncateContentTransformer = ({ content }: { content: string }): TruncatedContent => {
  const lines = content.split('\n');

  if (lines.length > contentTruncationConfigStatics.lineLimit) {
    return truncatedContentContract.parse(
      lines.slice(0, contentTruncationConfigStatics.lineLimit).join('\n'),
    );
  }

  return truncatedContentContract.parse(content.slice(0, contentTruncationConfigStatics.charLimit));
};
