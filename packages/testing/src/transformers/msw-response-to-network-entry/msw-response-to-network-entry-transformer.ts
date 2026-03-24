/**
 * PURPOSE: Transforms an MSW response event into a network log entry by reading the response body
 *
 * USAGE:
 * const entry = await mswResponseToNetworkEntryTransformer({ method, url, status: 200, durationMs: 12, source: 'mock', response, requestBody });
 * // Returns NetworkLogEntry with captured response body
 */

import { networkLogEntryContract } from '../../contracts/network-log-entry/network-log-entry-contract';
import { networkLogStatics } from '../../statics/network-log/network-log-statics';
import type { NetworkLogEntry } from '../../contracts/network-log-entry/network-log-entry-contract';

export const mswResponseToNetworkEntryTransformer = async ({
  method,
  url,
  status,
  durationMs,
  source,
  response,
  requestBody,
}: {
  method: NetworkLogEntry['method'];
  url: NetworkLogEntry['url'];
  status: NetworkLogEntry['status'];
  durationMs: NetworkLogEntry['durationMs'];
  source: 'mock' | 'bypass';
  response: Response;
  requestBody?: NetworkLogEntry['requestBody'];
}): Promise<NetworkLogEntry> => {
  const clonedResponse = response.clone();

  try {
    const body = await clonedResponse.text();
    const truncated = body.slice(0, networkLogStatics.limits.maxBodyLength);

    return networkLogEntryContract.parse({
      method,
      url,
      status,
      durationMs,
      requestBody,
      responseBody: truncated.length > 0 ? truncated : undefined,
      source,
    });
  } catch {
    return networkLogEntryContract.parse({
      method,
      url,
      status,
      durationMs,
      requestBody,
      source,
    });
  }
};
