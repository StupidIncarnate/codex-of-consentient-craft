import { join } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const pathJoinAdapterProxy = (): {
  returns: ({ paths, result }: { paths: readonly string[]; result: PathSegment }) => void;
} => {
  const handle = registerMock({ fn: join });

  handle.mockReturnValue('');

  return {
    returns: ({
      paths: _paths,
      result,
    }: {
      paths: readonly string[];
      result: PathSegment;
    }): void => {
      handle.mockReturnValueOnce(result);
    },
  };
};
