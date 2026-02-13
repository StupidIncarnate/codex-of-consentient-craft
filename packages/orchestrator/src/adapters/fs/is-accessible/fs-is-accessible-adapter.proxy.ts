jest.mock('fs/promises');

import { access } from 'fs/promises';

export const fsIsAccessibleAdapterProxy = (): {
  resolves: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(access);

  mock.mockResolvedValue(undefined);

  return {
    resolves: (): void => {
      mock.mockResolvedValueOnce(undefined);
    },

    rejects: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
