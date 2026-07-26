import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: PathSegment }) => void;
  throws: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
  getWrittenFor: ({ filepath }: { filepath: PathSegment }) => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const handle = registerMock({ fn: writeFile });

  return {
    // writeFile's PATH (argument 0) is the address; the body (argument 1) is unconstrained,
    // so any write to this path succeeds regardless of what it writes.
    succeeds: ({ filepath }: { filepath: PathSegment }): void => {
      handle.calledWith([filepath]).resolves({ success: true as const });
    },
    throws: ({ filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.calledWith([filepath]).rejects(error);
    },
    // Answers for this path only — never "whatever was written last".
    getWrittenFor: ({ filepath }: { filepath: PathSegment }): unknown =>
      handle.callsMatching([filepath]).at(-1)?.[1],
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      handle.callsMatching([]).map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
