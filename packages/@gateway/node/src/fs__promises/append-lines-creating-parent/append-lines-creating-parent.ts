/**
 * PURPOSE: Appends whole lines to a file, creating its parent directory and the file itself when
 * either is missing. An empty `lines` list is a deliberate no-op — nothing is created and nothing is
 * appended — so a caller that computed zero lines this round never has to guard the call itself.
 *
 * USAGE:
 * await appendLinesCreatingParent({
 *   path: '/repo/.dungeonmaster/event-outbox.jsonl',
 *   lines: [JSON.stringify(event)],
 * });
 * // Creates the parent directory if missing, then appends "<line>\n" for each line
 */

import { mkdir, appendFile as fsAppendFile } from 'fs/promises';
import { dirname } from 'path';

export const appendLinesCreatingParent = async ({
  path,
  lines,
}: {
  path: string;
  lines: readonly string[];
}): Promise<void> => {
  if (lines.length === 0) {
    return;
  }

  await mkdir(dirname(path), { recursive: true });
  await fsAppendFile(path, `${lines.join('\n')}\n`, 'utf8');
};
