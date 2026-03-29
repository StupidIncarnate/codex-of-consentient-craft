import { readFile } from 'fs/promises';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileAdapterProxy = (): {
  returns: (params: { contents: ReturnType<typeof FileContentsStub> }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

  mock.mockResolvedValue('');

  return {
    returns: ({ contents }: { contents: ReturnType<typeof FileContentsStub> }) => {
      mock.mockResolvedValueOnce(contents);
    },

    throws: ({ error }: { error: Error }) => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
