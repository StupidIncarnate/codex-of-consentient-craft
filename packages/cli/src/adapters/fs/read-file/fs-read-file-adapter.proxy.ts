import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { content: string }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: readFile });

  handle.mockResolvedValue('');

  return {
    resolves: ({ content }: { content: string }): void => {
      handle.mockResolvedValueOnce(content);
    },

    rejects: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
