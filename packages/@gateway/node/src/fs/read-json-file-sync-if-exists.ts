/**
 * PURPOSE: Reads a file and parses it as JSON, but treats ENOENT as "not there yet" rather
 * than a failure. Invalid JSON, an empty file and every other OS error still throw — only
 * absence is a valid answer.
 *
 * USAGE:
 * const config = readJsonFileSyncIfExists('/tmp/maybe.json');
 * // Returns the parsed JSON value (null is itself a possible parsed value), null when the
 * // path does not exist, or throws
 */
import { readFileSyncIfExists } from './read-file-sync-if-exists';

export const readJsonFileSyncIfExists = (path: string): unknown => {
  const contents = readFileSyncIfExists(path);
  if (contents === null) {
    return null;
  }
  try {
    return JSON.parse(contents) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new SyntaxError(`Invalid JSON in ${path}: ${reason}`, { cause: error });
  }
};
