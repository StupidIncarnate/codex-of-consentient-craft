/**
 * PURPOSE: Reads a file from disk and validates it as FileContents. A registry read routes
 * through here before a caller computes its next write — this adapter never itself changes
 * anything on disk, so it is the one of this trio (alongside fsWriteFileAdapter and
 * fsRenameAdapter) to reach for whenever only today's on-disk state is needed, never a change
 * to it. `encoding` defaults to `'utf8'` for the text files every other caller here reads
 * (registry, locks, manifests); a caller reading a binary file — a PNG shot — passes `'latin1'`,
 * the one encoding that maps each byte to a single code unit and round-trips arbitrary binary
 * data losslessly, matching what `pngjsDecodeAdapter` expects back. Reading a PNG with the
 * `'utf8'` default would corrupt it: invalid UTF-8 byte sequences collapse into replacement
 * characters, which is lossy and unrecoverable.
 *
 * USAGE:
 * await fsReadFileAdapter({
 *   filePath: AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/siegelense/registry.json' }),
 * });
 * // Returns validated FileContents
 *
 * await fsReadFileAdapter({ filePath: shotPath, encoding: 'latin1' });
 * // Returns the PNG bytes as a lossless FileContents string
 */

import { readFile } from 'fs/promises';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, FileContents } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapter = async ({
  filePath,
  encoding = 'utf8',
}: {
  filePath: AbsoluteFilePath;
  encoding?: BufferEncoding;
}): Promise<FileContents> => {
  try {
    const content = await readFile(filePath, encoding);
    return fileContentsContract.parse(content);
  } catch (error) {
    throw new Error(`Failed to read file at ${filePath}`, { cause: error });
  }
};
