import { readdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsReaddirAdapterProxy = (): {
  returns: (params: { entries: string[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: readdir });

  mock.mockResolvedValue([] as never);

  return {
    returns: ({ entries }: { entries: string[] }): void => {
      mock.mockResolvedValueOnce(entries as never);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
