/**
 * PURPOSE: The one funnel a `spawnerType: 'command'` work item's printed output passes through on
 * its way to the UI, live or replayed. A live stderr chunk and a whole saved output both arrive as
 * terminal text, so both are cleaned of ward's redraw codes and split into one assistant-text entry
 * per line here. Reach for this over `commandLineToChatEntryTransformer` whenever the text came
 * from a process: that one shapes a single line it is handed as-is, and two callers each cleaning
 * their own way is how the live row and the reloaded row drift apart.
 *
 * USAGE:
 * commandOutputToChatEntriesTransformer({ text: 'lint  a  running...\r\x1b[Klint  a  PASS\n' });
 * // Returns two ChatEntries, contents 'lint  a  running...' and 'lint  a  PASS'
 */

import type { ChatEntry } from '@dungeonmaster/shared/contracts';

import { commandLineToChatEntryTransformer } from '../command-line-to-chat-entry/command-line-to-chat-entry-transformer';
import { terminalTextCleanTransformer } from '../terminal-text-clean/terminal-text-clean-transformer';

export const commandOutputToChatEntriesTransformer = ({ text }: { text: string }): ChatEntry[] => {
  const cleaned = terminalTextCleanTransformer({ text });

  return cleaned === ''
    ? []
    : cleaned.split('\n').map((line) => commandLineToChatEntryTransformer({ line }));
};
