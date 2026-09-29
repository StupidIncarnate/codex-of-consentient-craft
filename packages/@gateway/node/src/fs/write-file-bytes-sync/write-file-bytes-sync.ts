/**
 * PURPOSE: Writes raw bytes to a file synchronously with no text encoding, for content that is not
 * UTF-8 text (a generated PNG fixture, a binary asset). The synchronous twin of `writeFileBytes`
 * in `#gateway/node/fs__promises`; reach for `writeFileSync` when the contents are text.
 *
 * USAGE:
 * writeFileBytesSync('/tmp/fixture/images/a.png', pngBytes);
 * // Writes the bytes as-is, replacing the file if it exists
 */
import { writeFileSync as nodeWriteFileSync } from 'fs';

export const writeFileBytesSync = (path: string, bytes: Uint8Array): void => {
  nodeWriteFileSync(path, bytes);
};
