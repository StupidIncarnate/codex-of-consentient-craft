/**
 * PURPOSE: Reads a file from a byte offset to the end. Reach for this over fsReadFileAdapter when
 *   the caller has already consumed the earlier bytes: a transcript is append-only and grows for
 *   hours, so re-reading it whole would re-count every message in it — and reading only the tail
 *   is what keeps the usage scan to a few kilobytes per tick against a 1.8 GB tree.
 *
 * USAGE:
 * await fsReadFileRangeAdapter({ filePath, fromByte: 4096 });
 * // Returns the file's contents from that offset onward, empty when the offset is past the end
 */

import { open } from 'fs/promises';

import {
  fileContentsContract,
  type FileContents,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

export const fsReadFileRangeAdapter = async ({
  filePath,
  fromByte,
}: {
  filePath: FilePath;
  fromByte: number;
}): Promise<FileContents> => {
  const handle = await open(filePath, 'r');

  try {
    const { size } = await handle.stat();
    const length = Math.max(0, size - fromByte);

    if (length === 0) {
      return fileContentsContract.parse('');
    }

    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, fromByte);

    return fileContentsContract.parse(buffer.toString('utf8'));
  } finally {
    await handle.close();
  }
};
