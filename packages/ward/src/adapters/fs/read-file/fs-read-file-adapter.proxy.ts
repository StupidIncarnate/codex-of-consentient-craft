import { readFile } from 'fs/promises';

jest.mock('fs/promises');

export const fsReadFileAdapterProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readFile);

  mock.mockResolvedValue('' as never);

  return {
    returns: ({ content }: { content: string }): void => {
      mock.mockResolvedValueOnce(content as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
