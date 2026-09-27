/**
 * PURPOSE: Decodes a base64 string and writes the resulting bytes, for callers that already hold
 * base64 (a chat image attachment) rather than a Uint8Array. Delegates to writeFileBytes once
 * decoded, so both share the same on-disk behaviour and the same sad paths.
 *
 * USAGE:
 * await writeFileFromBase64('/repo/tmp/image.png', base64Contents);
 * // Decodes the base64 payload and writes the bytes
 */

import { writeFileBytes } from '../write-file-bytes/write-file-bytes';

export const writeFileFromBase64 = async (path: string, base64: string): Promise<void> =>
  writeFileBytes(path, Buffer.from(base64, 'base64'));
