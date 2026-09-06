/**
 * PURPOSE: Checks whether a chat entry has an equivalent peer (same role + same normalised content) in a candidate list. Used to dedupe locally-staged user messages against binding-delivered entries once replay catches up — comparing normalised content lets a pasted-image message match its transcript copy even though the two carry different image references and a trailer.
 *
 * USAGE:
 * hasEquivalentChatEntryGuard({ entry: localUserMsg, among: bindingEntries });
 * // Returns true if any entry in `among` has the same role and normalised content as `entry`.
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { normaliseChatContentTransformer } from '../../transformers/normalise-chat-content/normalise-chat-content-transformer';

export const hasEquivalentChatEntryGuard = ({
  entry,
  among,
}: {
  entry?: ChatEntry;
  among?: readonly ChatEntry[];
}): boolean => {
  if (entry === undefined) return false;
  if (among === undefined) return false;
  if (!('content' in entry)) return false;
  const entryContent = normaliseChatContentTransformer({ content: String(entry.content) });
  return among.some((other) => {
    if (other.role !== entry.role) return false;
    if (!('content' in other)) return false;
    return normaliseChatContentTransformer({ content: String(other.content) }) === entryContent;
  });
};
