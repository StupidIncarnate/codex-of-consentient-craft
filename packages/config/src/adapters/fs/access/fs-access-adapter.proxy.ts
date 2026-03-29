import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsAccessAdapterProxy = (): {
  resolves: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: access });

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
