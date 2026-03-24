/**
 * PURPOSE: Truncates a network request or response body to the configured max length
 *
 * USAGE:
 * truncateNetworkBodyTransformer({body: 'very long body...'});
 * // Returns truncated body with '...' suffix if exceeding maxBodyLength
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import { networkLogStatics } from '../../statics/network-log/network-log-statics';

export const truncateNetworkBodyTransformer = ({ body }: { body: ContentText }): ContentText => {
  if (String(body).length <= networkLogStatics.limits.maxBodyLength) {
    return contentTextContract.parse(body);
  }
  return contentTextContract.parse(
    `${String(body).slice(0, networkLogStatics.limits.maxBodyLength)}...`,
  );
};
