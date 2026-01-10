jest.mock('fs/promises');

import { unlink } from 'fs/promises';

export const fsUnlinkAdapterProxy = (): {
  succeeds: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(unlink);

  mock.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce(undefined);
    },

    rejects: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
