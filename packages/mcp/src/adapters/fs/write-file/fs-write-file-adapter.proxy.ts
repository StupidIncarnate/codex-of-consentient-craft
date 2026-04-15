import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileContents, PathSegment } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filepath, contents }: { filepath: PathSegment; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
  getWrittenContent: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const handle = registerMock({ fn: writeFile });

  handle.mockResolvedValue({ success: true as const });

  return {
    succeeds: ({
      filepath: _filepath,
      contents: _contents,
    }: {
      filepath: PathSegment;
      contents: FileContents;
    }): void => {
      handle.mockResolvedValueOnce({ success: true as const });
    },
    throws: ({ filepath: _filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getWrittenContent: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      handle.mock.calls.map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
