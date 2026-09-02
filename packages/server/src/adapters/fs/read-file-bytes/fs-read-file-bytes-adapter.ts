/**
 * PURPOSE: Reach for this over fsReadFileAdapter when the file on disk is binary — a pasted
 * image, for instance. fsReadFileAdapter decodes as utf8 and hands back FileContents, which
 * corrupts binary data; omitting the encoding argument here is what keeps the bytes intact.
 *
 * USAGE:
 * const bytes = await fsReadFileBytesAdapter({ filePath: AbsoluteFilePathStub({ value: '/tmp/pasted-image.png' }) });
 * // Returns the raw bytes read from filePath
 */

import { readFile } from 'fs/promises';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileBytesAdapter = async ({
  filePath,
}: {
  filePath: AbsoluteFilePath;
}): Promise<Uint8Array> => readFile(filePath);
