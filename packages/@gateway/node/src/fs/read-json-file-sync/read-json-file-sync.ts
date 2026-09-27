/**
 * PURPOSE: Reads a file and parses it as JSON, naming the path in the parse failure — a bare
 * `JSON.parse` error names no file, which leaves a caller unable to tell which read failed.
 *
 * USAGE:
 * const config = readJsonFileSync('/tmp/config.json');
 * // Returns the parsed JSON value, or throws a SyntaxError naming the path
 */
import { readFileSync } from '../read-file-sync/read-file-sync';

export const readJsonFileSync = (path: string): unknown => {
  const contents = readFileSync(path);
  try {
    return JSON.parse(contents) as unknown;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new SyntaxError(`Invalid JSON in ${path}: ${reason}`, { cause: error });
  }
};
