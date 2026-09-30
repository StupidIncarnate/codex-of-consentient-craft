/**
 * PURPOSE: Reads file content or returns empty string if file doesn't exist
 *
 * USAGE:
 * const content = await fileReadOrEmptyBroker({ filePath });
 * // Returns file content or empty string on ENOENT
 */
import { readFile } from '#gateway/node/fs__promises';
import { isFsError } from '#gateway/node/fs';

export const fileReadOrEmptyBroker = async ({
  filePath,
}: {
  filePath: string;
}): Promise<string> => {
  try {
    const contents = await readFile(filePath);
    return contents;
  } catch (error: unknown) {
    if (!isFsError({ error, code: 'ENOENT' })) {
      throw error;
    }
    return '';
  }
};
