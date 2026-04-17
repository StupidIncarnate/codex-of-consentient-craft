/**
 * PURPOSE: Converts a normalized Claude line (or null on parse failure) into ChatEntry[], falling back to a single assistant-text entry for plain-text lines (e.g., ward build/test output)
 *
 * USAGE:
 * rawLineToChatEntriesTransformer({ parsed: null, rawLine: 'lint @dungeonmaster/shared PASS  42 files' });
 * // Returns [{ role: 'assistant', type: 'text', content: 'lint @dungeonmaster/shared PASS  42 files' }]
 *
 * rawLineToChatEntriesTransformer({ parsed: normalizedClaudeLine, rawLine: '...' });
 * // Returns ChatEntry[] from streamJsonToChatEntry, or [] when no entries are produced
 */

import { chatEntryContract } from '@dungeonmaster/shared/contracts';
import type { ChatEntry } from '@dungeonmaster/shared/contracts';
import { streamJsonToChatEntryTransformer } from '../stream-json-to-chat-entry/stream-json-to-chat-entry-transformer';

export const rawLineToChatEntriesTransformer = ({
  parsed,
  rawLine,
}: {
  parsed: unknown;
  rawLine: string;
}): ChatEntry[] => {
  if (parsed === null) {
    if (rawLine.length === 0) {
      return [];
    }
    return [chatEntryContract.parse({ role: 'assistant', type: 'text', content: rawLine })];
  }
  return streamJsonToChatEntryTransformer({ parsed }).entries;
};
