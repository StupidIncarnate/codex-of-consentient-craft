/**
 * PURPOSE: Writes raw bytes to a file with no text encoding, for content that is not UTF-8 text (a
 * captured screenshot, a binary asset). Pairs with readFileBytes.
 *
 * USAGE:
 * await writeFileBytes('/repo/tmp/frame.png', pngBytes);
 * // Writes the bytes as-is
 */

import { writeFile as fsWriteFile } from 'fs/promises';

export const writeFileBytes = async (path: string, bytes: Uint8Array): Promise<void> =>
  fsWriteFile(path, bytes);
