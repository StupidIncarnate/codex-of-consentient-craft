/**
 * PURPOSE: Reads a file and parses it as JSON, answering `null` when the file is not there.
 * Invalid JSON still throws — "missing" and "broken" are different answers, and collapsing them
 * is the settings-file data-loss bug this gateway replaces.
 *
 * USAGE:
 * await readJsonFileIfExists('/repo/.claude/settings.json');
 * // Returns the parsed value, or null when the path does not exist; throws on invalid JSON
 */

import { readJsonFile } from './read-json-file';
import { isFsError } from '../is-fs-error';

export const readJsonFileIfExists = async (path: string): Promise<unknown | null> => {
  try {
    return await readJsonFile(path);
  } catch (error: unknown) {
    if (isFsError({ error, code: 'ENOENT' })) {
      return null;
    }
    throw error;
  }
};
