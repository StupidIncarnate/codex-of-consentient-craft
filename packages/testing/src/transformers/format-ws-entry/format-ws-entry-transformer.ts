/**
 * PURPOSE: Formats a single WebSocket log entry into a human-readable string
 *
 * USAGE:
 * formatWsEntryTransformer({wsEntry: WsLogEntryStub()});
 * // Returns "+12ms <- {"type":"quest-modified"}"
 */

import { contentTextContract, type ContentText } from '@dungeonmaster/shared/contracts';

import type { WsLogEntry } from '../../contracts/ws-log-entry/ws-log-entry-contract';
import { truncateNetworkBodyTransformer } from '../truncate-network-body/truncate-network-body-transformer';

export const formatWsEntryTransformer = ({ wsEntry }: { wsEntry: WsLogEntry }): ContentText => {
  const arrow = wsEntry.direction === 'sent' ? '\u2192' : '\u2190';
  const truncatedData = truncateNetworkBodyTransformer({
    body: contentTextContract.parse(wsEntry.data),
  });
  return contentTextContract.parse(
    `+${String(wsEntry.elapsedMs)}ms ${arrow} ${String(truncatedData)}`,
  );
};
