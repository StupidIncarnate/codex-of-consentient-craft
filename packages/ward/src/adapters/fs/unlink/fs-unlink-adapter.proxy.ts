import { unlink } from 'fs/promises';

jest.mock('fs/promises');

export const fsUnlinkAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(unlink);

  mock.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
