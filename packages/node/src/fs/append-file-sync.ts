/**
 * PURPOSE: OUR guarded `fs.appendFileSync`: fixed UTF-8, and every OS error passed through
 * unchanged. Creates the file when it is missing; a torn last line is possible on a crash
 * mid-write, so a reader consuming this file line by line should tolerate one.
 *
 * USAGE:
 * appendFileSync('/repo/tmp/scratch.log', 'a line\n');
 * // Appends the text; creates the file first if it does not exist
 */
import { appendFileSync as nodeAppendFileSync } from 'fs';

export const appendFileSync = (path: string, contents: string): void => {
  nodeAppendFileSync(path, contents, 'utf8');
};
