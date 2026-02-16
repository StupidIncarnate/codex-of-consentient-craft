import { readdir } from 'fs/promises';

jest.mock('fs/promises');

export const fsReaddirAdapterProxy = (): {
  returns: (params: { entries: string[] }) => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(readdir);

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
