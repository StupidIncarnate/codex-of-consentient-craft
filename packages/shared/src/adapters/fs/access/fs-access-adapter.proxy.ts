import { access } from 'fs/promises';

jest.mock('fs/promises');

export const fsAccessAdapterProxy = (): {
  resolves: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock = jest.mocked(access);

  mock.mockResolvedValue(undefined);

  return {
    resolves: () => {
      mock.mockResolvedValueOnce(undefined);
    },

    rejects: ({ error }: { error: Error }) => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
