/**
 * PURPOSE: Writes raw bytes to disk unchanged. Reach for this over fsWriteFileBase64Adapter when
 * the payload is already a Uint8Array read straight off another file — the local-image copy broker
 * moves a source image's bytes to its quest-images destination with no base64 encode/decode round
 * trip in between.
 *
 * USAGE:
 * await fsWriteFileBytesAdapter({ filePath, bytes });
 * // Writes bytes verbatim to filePath and returns { success: true }
 */

import { writeFile } from 'fs/promises';
import type { AbsoluteFilePath, AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsWriteFileBytesAdapter = async ({
  filePath,
  bytes,
}: {
  filePath: AbsoluteFilePath;
  bytes: Uint8Array;
}): Promise<AdapterResult> => {
  await writeFile(filePath, bytes);

  return { success: true as const };
};
