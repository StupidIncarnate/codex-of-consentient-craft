import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsAccessAdapterProxy = (): {
  resolves: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: access });

  handle.mockResolvedValue(undefined);

  return {
    resolves: () => {
      handle.mockResolvedValueOnce(undefined);
    },

    rejects: ({ error }: { error: Error }) => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
