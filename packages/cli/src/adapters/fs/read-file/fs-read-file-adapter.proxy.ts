import { readFile } from 'fs/promises';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
}));

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { content: string }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readFile);

  mock.mockResolvedValue('');

  return {
    resolves: ({ content }: { content: string }): void => {
      mock.mockResolvedValueOnce(content);
    },

    rejects: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
