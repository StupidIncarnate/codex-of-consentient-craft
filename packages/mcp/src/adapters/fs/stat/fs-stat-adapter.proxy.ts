import { stat } from 'fs/promises';
import type { Stats } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const fsStatAdapterProxy = (): {
  returns: (params: { filepath: PathSegment; stats: Partial<Stats> }) => void;
  throws: (params: { filepath: PathSegment; error: Error }) => void;
} => {
  const handle = registerMock({ fn: stat });

  return {
    // stat's PATH (its only argument) is the address.
    returns: ({ filepath, stats }: { filepath: PathSegment; stats: Partial<Stats> }): void => {
      handle.calledWith([filepath]).resolves(stats as Stats);
    },
    throws: ({ filepath, error }: { filepath: PathSegment; error: Error }): void => {
      handle.calledWith([filepath]).rejects(error);
    },
  };
};
