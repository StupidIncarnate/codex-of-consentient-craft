/**
 * PURPOSE: Appends UTF-8 text to a file, creating it when absent. A concurrent writer or a crash
 * mid-append can leave a torn last line, so a reader pairs this with readNonEmptyLines rather than
 * assuming every appended line is whole.
 *
 * USAGE:
 * await appendFile('/repo/.dungeonmaster/event-outbox.jsonl', `${JSON.stringify(event)}\n`);
 * // Appends the text; creates the file first if it does not exist
 */

import { appendFile as fsAppendFile } from 'fs/promises';

export const appendFile = async (path: string, contents: string): Promise<void> =>
  fsAppendFile(path, contents, 'utf8');
