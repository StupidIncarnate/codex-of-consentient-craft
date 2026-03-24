/**
 * PURPOSE: Formats a single HTTP network log entry into a human-readable multi-line string
 *
 * USAGE:
 * formatHttpEntryTransformer({entry: NetworkLogEntryStub()});
 * // Returns "GET  /api/guilds -> 200 (12ms) [mock]\n  -> body\n  <- body"
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { NetworkLogEntry } from '../../contracts/network-log-entry/network-log-entry-contract';
import { networkLogStatics } from '../../statics/network-log/network-log-statics';
import { truncateNetworkBodyTransformer } from '../truncate-network-body/truncate-network-body-transformer';

const LOCALHOST_PREFIX_PATTERN = /^https?:\/\/localhost(?::\d+)?/u;

export const formatHttpEntryTransformer = ({ entry }: { entry: NetworkLogEntry }): ContentText => {
  const normalizedUrl = String(entry.url).replace(LOCALHOST_PREFIX_PATTERN, '');
  const method = String(entry.method).padEnd(networkLogStatics.formatting.methodPadWidth);

  if (entry.error) {
    return contentTextContract.parse(
      `${method} ${normalizedUrl} \u2192 \u2717 ${String(entry.error)}`,
    );
  }

  const status =
    entry.status === undefined ? networkLogStatics.formatting.unknownStatus : String(entry.status);
  const duration = entry.durationMs === undefined ? '' : ` (${String(entry.durationMs)}ms)`;
  const source = ` [${entry.source}]`;
  const header = `${method} ${normalizedUrl} \u2192 ${status}${duration}${source}`;

  const requestLine = entry.requestBody
    ? `  \u2192 ${String(truncateNetworkBodyTransformer({ body: contentTextContract.parse(entry.requestBody) }))}`
    : `  \u2192 ${networkLogStatics.formatting.noBodyPlaceholder}`;

  const responseLine = entry.responseBody
    ? `  \u2190 ${String(truncateNetworkBodyTransformer({ body: contentTextContract.parse(entry.responseBody) }))}`
    : `  \u2190 ${networkLogStatics.formatting.noBodyPlaceholder}`;

  return contentTextContract.parse([header, requestLine, responseLine].join('\n'));
};
