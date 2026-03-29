import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReadFileAdapterProxy = (): {
  returns: (params: { content: string }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: readFile });

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
