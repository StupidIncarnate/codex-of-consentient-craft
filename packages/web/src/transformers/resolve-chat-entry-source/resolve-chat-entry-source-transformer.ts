/**
 * PURPOSE: Resolves the source of a chat entry, defaulting undefined to 'session'
 *
 * USAGE:
 * resolveChatEntrySourceTransformer({entry: chatEntry});
 * // Returns 'session' or 'subagent'
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

export const resolveChatEntrySourceTransformer = ({
  entry,
}: {
  entry: ChatEntry;
}): 'session' | 'subagent' =>
  'source' in entry && entry.source === 'subagent' ? 'subagent' : 'session';
