import { readFile } from 'fs/promises';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

jest.mock('fs/promises');

export const fsReadFileAdapterProxy = (): {
  returns: (params: { contents: ReturnType<typeof FileContentsStub> }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readFile);

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
