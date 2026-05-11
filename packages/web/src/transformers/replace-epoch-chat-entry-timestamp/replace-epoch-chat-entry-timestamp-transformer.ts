/**
 * PURPOSE: Replaces the orchestrator's epoch-timestamp sentinel on a ChatEntry with the time the entry was observed at the WS boundary
 *
 * USAGE:
 * replaceEpochChatEntryTimestampTransformer({ entry });
 * // Returns the same ChatEntry unchanged if its timestamp is real; or a re-parsed ChatEntry
 * // with `timestamp = new Date().toISOString()` if the orchestrator stamped epoch.
 *
 * Claude CLI omits the `timestamp` field on most streaming-stdout lines, so
 * `extractTimestampFromJsonlLineTransformer` falls back to `1970-01-01T00:00:00.000Z`.
 * The web sorts ChatEntries by timestamp globally so user-typed messages (real
 * `new Date().toISOString()`) interleave correctly with agent entries. Without this
 * normalization, every streamed agent entry sorts to 1970 and every user-typed entry
 * sorts to 2026 — so the user's answer always lands AT THE BOTTOM of the chat panel,
 * even if they typed before the agent's response arrived. Observation-time keeps
 * arrival order intact whenever the wire shape doesn't carry a timestamp of its own.
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { chatEntryContract } from '@dungeonmaster/shared/contracts';

const EPOCH_TIMESTAMP_SENTINEL = '1970-01-01T00:00:00.000Z';

export const replaceEpochChatEntryTimestampTransformer = ({
  entry,
}: {
  entry: ChatEntry;
}): ChatEntry =>
  String(entry.timestamp) === EPOCH_TIMESTAMP_SENTINEL
    ? chatEntryContract.parse({ ...entry, timestamp: new Date().toISOString() })
    : entry;
