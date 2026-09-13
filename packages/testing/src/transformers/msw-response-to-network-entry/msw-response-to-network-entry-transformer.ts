/**
 * PURPOSE: Transforms an MSW response event into a network log entry by reading the response
 * body. Takes the caller's known fields as one `entry`, since the caller already holds them
 * together as a NetworkLogEntry shape (built from a pending request plus the live response's
 * status) before this fills in the response body.
 *
 * USAGE:
 * const captured = await mswResponseToNetworkEntryTransformer({ entry, response });
 * // Returns NetworkLogEntry with entry's fields plus the captured response body
 */

import { networkLogEntryContract } from '../../contracts/network-log-entry/network-log-entry-contract';
import { networkLogStatics } from '../../statics/network-log/network-log-statics';
import type { NetworkLogEntry } from '../../contracts/network-log-entry/network-log-entry-contract';

export const mswResponseToNetworkEntryTransformer = async ({
  entry,
  response,
}: {
  entry: NetworkLogEntry;
  response: Response;
}): Promise<NetworkLogEntry> => {
  const clonedResponse = response.clone();

  try {
    const body = await clonedResponse.text();
    const truncated = body.slice(0, networkLogStatics.limits.maxBodyLength);

    return networkLogEntryContract.parse({
      method: entry.method,
      url: entry.url,
      status: entry.status,
      durationMs: entry.durationMs,
      requestBody: entry.requestBody,
      responseBody: truncated.length > 0 ? truncated : undefined,
      source: entry.source,
    });
  } catch {
    return networkLogEntryContract.parse({
      method: entry.method,
      url: entry.url,
      status: entry.status,
      durationMs: entry.durationMs,
      requestBody: entry.requestBody,
      source: entry.source,
    });
  }
};
