/**
 * PURPOSE: Reads a file from a byte offset to the end. Reach for this over readFile when the
 * caller has already consumed the earlier bytes — an append-only transcript that grows for hours
 * would otherwise be re-read whole on every tick.
 *
 * USAGE:
 * await readFileFromOffset({ path: '/home/user/.claude/sessions/abc.jsonl', fromByte: 4096 });
 * // Returns the file's contents from that offset onward; '' when the offset is past the end
 */

import { open } from 'fs/promises';

export const readFileFromOffset = async ({
  path,
  fromByte,
}: {
  path: string;
  fromByte: number;
}): Promise<string> => {
  const handle = await open(path, 'r');

  try {
    const { size } = await handle.stat();
    const length = Math.max(0, size - fromByte);

    if (length === 0) {
      return '';
    }

    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, fromByte);

    return buffer.toString('utf8');
  } finally {
    await handle.close();
  }
};
