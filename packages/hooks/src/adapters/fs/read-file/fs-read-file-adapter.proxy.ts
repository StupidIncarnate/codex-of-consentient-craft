jest.mock('fs/promises');

import { readFile } from 'fs/promises';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapterProxy = (): {
  returns: ({ contents }: { contents: FileContents }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mock = jest.mocked(readFile);

  mock.mockResolvedValue('');

  return {
    returns: ({ contents }: { contents: FileContents }) => {
      mock.mockResolvedValueOnce(contents);
    },
    throws: ({ error }: { error: Error }) => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
