/**
 * PURPOSE: Pulls the `entries` field off an orchestration-event chat-output payload, validates each element through chatEntryContract, and returns the valid subset
 *
 * USAGE:
 * const entries = parseChatOutputEntriesTransformer({ payload });
 * // Returns: ChatEntry[] — every element of payload.entries that parses; empty array when the payload has no entries or all are malformed
 *
 * WHEN-TO-USE: At the server's chat-output broadcaster boundary, to recover a typed
 *   ChatEntry[] from the bus's unknown-shaped payload before applying entry-level filters.
 * WHEN-NOT-TO-USE: When the caller already has a typed ChatEntry[] in hand.
 */

import { chatEntryContract, type ChatEntry } from '@dungeonmaster/shared/contracts';

export const parseChatOutputEntriesTransformer = ({
  payload,
}: {
  payload: Record<PropertyKey, unknown>;
}): ChatEntry[] => {
  const raw = payload.entries;
  if (!Array.isArray(raw)) return [];
  const result: ChatEntry[] = [];
  for (const candidate of raw) {
    const parsed = chatEntryContract.safeParse(candidate);
    if (parsed.success) result.push(parsed.data);
  }
  return result;
};
