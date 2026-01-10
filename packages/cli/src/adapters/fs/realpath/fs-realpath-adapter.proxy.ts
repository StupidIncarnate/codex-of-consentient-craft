jest.mock('node:fs');

import { realpathSync } from 'node:fs';

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsRealpathAdapterProxy = (): {
  resolves: (params: { resolvedPath: AbsoluteFilePath }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(realpathSync);

  // Default: return input unchanged (cast to satisfy mock return type)
  mock.mockImplementation((path) => path as never);

  return {
    resolves: ({ resolvedPath }: { resolvedPath: AbsoluteFilePath }): void => {
      mock.mockReturnValueOnce(resolvedPath as never);
    },

    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
