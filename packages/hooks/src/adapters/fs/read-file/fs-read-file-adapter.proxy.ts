import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';

export const fsReadFileAdapterProxy = (): {
  returns: ({ contents }: { contents: FileContents }) => void;
  throws: ({ error }: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

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
