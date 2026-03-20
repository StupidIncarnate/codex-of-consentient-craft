import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const fsReaddirAdapterProxy = (): {
  returns: (params: { files: FileName[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: readdirSync });

  handle.mockReturnValue([]);

  return {
    returns: ({ files }: { files: FileName[] }): void => {
      handle.mockReturnValueOnce(files as never);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
