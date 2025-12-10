import { readFile } from 'fs/promises';

jest.mock('fs/promises');

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { content: string }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readFile);

  mock.mockResolvedValue('');

  return {
    resolves: ({ content }: { content: string }) => {
      mock.mockResolvedValueOnce(content);
    },

    rejects: ({ error }: { error: Error }) => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
