/**
 * PURPOSE: A real `Buffer` instance, built through `Buffer.from` — for a caller staging
 * `#gateway/node/fs/read-file-bytes-sync`'s return value instead of hand-typing one.
 *
 * USAGE:
 * const buffer = ReadFileBytesSyncStub({ text: 'binary contents' });
 * // Returns a real Buffer
 */
export const ReadFileBytesSyncStub = ({
  text = 'hello',
  bytes,
}: {
  text?: string;
  bytes?: Buffer;
} = {}): Buffer => bytes ?? Buffer.from(text, 'utf8');
