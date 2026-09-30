/**
 * PURPOSE: Truncates a network request or response body to the configured max length
 *
 * USAGE:
 * truncateNetworkBodyTransformer({body: 'very long body...'});
 * // Returns truncated body with '...' suffix if exceeding maxBodyLength
 */


import { networkLogStatics } from '../../statics/network-log/network-log-statics';

export const truncateNetworkBodyTransformer = ({ body }: { body: string }): string => {
  if (String(body).length <= networkLogStatics.limits.maxBodyLength) {
    return body;
  }
  return `${String(body).slice(0, networkLogStatics.limits.maxBodyLength)}...`;
};
