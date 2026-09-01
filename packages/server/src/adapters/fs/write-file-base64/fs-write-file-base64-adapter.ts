/**
 * PURPOSE: Persists a pasted-image upload to disk. Reach for this over fsWriteFileAdapter
 * whenever the payload is base64-encoded binary rather than UTF-8 text — the 'base64' encoding
 * argument tells Node to decode the string before writing, so the bytes landing on disk are the
 * image itself, not a copy of its base64 text.
 *
 * USAGE:
 * await fsWriteFileBase64Adapter({ filePath, dataBase64 });
 * // Decodes dataBase64 and writes the resulting bytes to filePath
 */

import { writeFile } from 'fs/promises';
import type {
  AbsoluteFilePath,
  AdapterResult,
  Base64ImageData,
} from '@dungeonmaster/shared/contracts';

export const fsWriteFileBase64Adapter = async ({
  filePath,
  dataBase64,
}: {
  filePath: AbsoluteFilePath;
  dataBase64: Base64ImageData;
}): Promise<AdapterResult> => {
  await writeFile(filePath, dataBase64, 'base64');

  return { success: true as const };
};
