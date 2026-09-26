/**
 * PURPOSE: Reads a file and parses it as JSON, raising a SyntaxError that names the path on
 * malformed content — `JSON.parse`'s own message never says which file broke, and today's callers
 * cannot tell either. Reach for readJsonFileIfExists when a missing file is an ordinary answer.
 *
 * USAGE:
 * await readJsonFile('/repo/.dungeonmaster.json');
 * // Returns the parsed value; throws a SyntaxError naming the path on invalid JSON
 */

import { readFile } from './read-file';

export const readJsonFile = async (path: string): Promise<unknown> => {
  const contents = await readFile(path);

  try {
    return JSON.parse(contents);
  } catch {
    throw new SyntaxError(`Invalid JSON in ${path}`);
  }
};
