/**
 * PURPOSE: A `FileHandle` for code that opens a file through `fs/promises` and reads it, with no
 * real file behind it. Only the members `readFileFromOffset` uses do real work: `stat` reports
 * `size` through `StatsStub`, `read` writes `contents` into the caller's buffer at the caller's
 * offset, `close` resolves. Built THROUGH `fileHandleSchema.parse` (BR C9), so it returns the
 * branded value with no cast, and a handle missing a member fails to parse.
 *
 * USAGE:
 * const handle = FileHandleStub({ size: 5, contents: 'hello' });
 * await handle.stat(); // Stats with size 5
 * // Returns a FileHandle (branded '#GatewayFileHandle')
 */
import type { Stats } from 'fs';
import { fileHandleSchema } from './file-handle-schema';
import { StatsStub } from '../../fs/stats/stats.stub';

export const FileHandleStub = ({
  size,
  contents,
}: {
  size: number;
  contents: string;
}): ReturnType<typeof fileHandleSchema.parse> =>
  fileHandleSchema.parse({
    fd: 3,
    stat: async (): Promise<Stats> => Promise.resolve(StatsStub({ sizeBytes: size })),
    read: async (
      buffer: Buffer,
      offset: number,
      length: number,
    ): Promise<{ bytesRead: number; buffer: Buffer }> =>
      Promise.resolve({ bytesRead: buffer.write(contents, offset, length, 'utf8'), buffer }),
    close: async (): Promise<void> => Promise.resolve(undefined),
  });
