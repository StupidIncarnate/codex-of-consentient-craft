/**
 * PURPOSE: Checks whether a chat entry has an equivalent peer (same role + same content string) in a candidate list. Used to dedupe locally-staged user messages against binding-delivered entries once replay catches up.
 *
 * USAGE:
 * hasEquivalentChatEntryGuard({ entry: localUserMsg, among: bindingEntries });
 * // Returns true if any entry in `among` has the same role and same content string as `entry`.
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

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
  const entryContent = String(entry.content);
  return among.some((other) => {
    if (other.role !== entry.role) return false;
    if (!('content' in other)) return false;
    return String(other.content) === entryContent;
  });
};
