import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { content: string }) => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readFile });

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
