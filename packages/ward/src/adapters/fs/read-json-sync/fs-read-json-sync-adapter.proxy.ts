import { readFileSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadJsonSyncAdapterProxy = (): {
  returns: (params: { filePath: FilePath; content: string }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFileSync });

  return {
    returns: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      mock.calledWith([String(filePath)]).returns(content as never);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([String(filePath)]).throws(error);
    },
  };
};
