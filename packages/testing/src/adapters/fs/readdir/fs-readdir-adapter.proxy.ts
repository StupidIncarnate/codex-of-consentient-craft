import { readdirSync } from 'fs';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

jest.mock('fs');

export const fsReaddirAdapterProxy = (): {
  returns: ({ files }: { dirPath: string; files: FileName[] }) => void;
  throws: ({ error }: { dirPath: string; error: Error }) => void;
} => {
  const mock = jest.mocked(readdirSync);

  mock.mockReturnValue([]);

  return {
    returns: ({ files }: { dirPath: string; files: FileName[] }): void => {
      mock.mockReturnValueOnce(files as never);
    },
    throws: ({ error }: { dirPath: string; error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
