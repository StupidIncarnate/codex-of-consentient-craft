import { readdirSync } from 'fs';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

jest.mock('fs');

export const fsReaddirAdapterProxy = (): {
  returns: (params: { files: FileName[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readdirSync);

  mock.mockReturnValue([]);

  return {
    returns: ({ files }: { files: FileName[] }): void => {
      mock.mockReturnValueOnce(files as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
