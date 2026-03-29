import { realpathSync } from 'node:fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsRealpathAdapterProxy = (): {
  resolves: (params: { resolvedPath: AbsoluteFilePath }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: realpathSync });

  // Default: return input unchanged (cast to satisfy mock return type)
  handle.mockImplementation((path) => path);

  return {
    resolves: ({ resolvedPath }: { resolvedPath: AbsoluteFilePath }): void => {
      handle.mockReturnValueOnce(resolvedPath as never);
    },

    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
