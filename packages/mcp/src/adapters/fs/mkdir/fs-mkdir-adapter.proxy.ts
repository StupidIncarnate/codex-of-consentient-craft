import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: PathSegment }) => void;
  throws: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
} => {
  const handle = registerMock({ fn: mkdir });

  return {
    // mkdir's PATH (argument 0) is the address; the recursive option is unconstrained.
    succeeds: ({ filepath }: { filepath: PathSegment }): void => {
      handle.calledWith([filepath]).resolves({ success: true as const });
    },
    throws: ({ filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.calledWith([filepath]).rejects(error);
    },
  };
};
