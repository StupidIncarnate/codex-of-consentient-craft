import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const fsReadJsonlAdapterProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readFile });

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
