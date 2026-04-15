import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filepath }: { filepath: PathSegment }) => void;
  throws: ({ filepath, error }: { filepath: PathSegment; error: Error }) => void;
} => {
  const handle = registerMock({ fn: mkdir });

  handle.mockResolvedValue({ success: true as const });

  return {
    succeeds: ({ filepath: _filepath }: { filepath: PathSegment }): void => {
      handle.mockResolvedValueOnce({ success: true as const });
    },
    throws: ({ filepath: _filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
