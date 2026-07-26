import { realpathSync } from 'node:fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsRealpathAdapterProxy = (): {
  resolves: (params: { filePath: AbsoluteFilePath; resolvedPath: AbsoluteFilePath }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const handle = registerMock({ fn: realpathSync });

  return {
    resolves: ({
      filePath,
      resolvedPath,
    }: {
      filePath: AbsoluteFilePath;
      resolvedPath: AbsoluteFilePath;
    }): void => {
      handle.calledWith([filePath]).returns(resolvedPath as never);
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      handle.calledWith([filePath]).throws(error);
    },
  };
};
