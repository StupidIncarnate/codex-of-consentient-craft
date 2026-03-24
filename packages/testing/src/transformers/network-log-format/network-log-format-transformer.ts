/**
 * PURPOSE: Formats network log entries and WebSocket entries into a human-readable diagnostic string
 *
 * USAGE:
 * networkLogFormatTransformer({entries: [entry], wsEntries: [wsEntry]});
 * // Returns formatted string like "--- Network Log (1 requests) ---\nGET /api/guilds -> 200 (12ms) [mock]\n---"
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { NetworkLogEntry } from '../../contracts/network-log-entry/network-log-entry-contract';
import type { WsLogEntry } from '../../contracts/ws-log-entry/ws-log-entry-contract';
import { formatHttpEntryTransformer } from '../format-http-entry/format-http-entry-transformer';
import { formatWsEntryTransformer } from '../format-ws-entry/format-ws-entry-transformer';

export const networkLogFormatTransformer = ({
  entries,
  wsEntries,
}: {
  entries: NetworkLogEntry[];
  wsEntries: WsLogEntry[];
}): ContentText => {
  const lines: ContentText[] = [];

  if (entries.length > 0) {
    lines.push(
      contentTextContract.parse(`--- Network Log (${String(entries.length)} requests) ---`),
    );
    for (const entry of entries) {
      lines.push(formatHttpEntryTransformer({ entry }));
    }
  }

  if (wsEntries.length > 0) {
    lines.push(
      contentTextContract.parse(`--- WebSocket (${String(wsEntries.length)} messages) ---`),
    );
    for (const wsEntry of wsEntries) {
      lines.push(formatWsEntryTransformer({ wsEntry }));
    }
  }

  if (lines.length > 0) {
    lines.push(contentTextContract.parse('---'));
  }

  return contentTextContract.parse(lines.join('\n'));
};
