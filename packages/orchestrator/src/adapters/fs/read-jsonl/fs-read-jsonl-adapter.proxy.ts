jest.mock('fs/promises');

import { readFile } from 'fs/promises';

export const fsReadJsonlAdapterProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readFile);

  mock.mockResolvedValue('');

  return {
    returns: ({ content }: { content: string }): void => {
      mock.mockResolvedValueOnce(content);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
