import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsAccessAdapterProxy = (): {
  resolves: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: access });

  mock.mockResolvedValue({ success: true as const });

  return {
    resolves: () => {
      mock.mockResolvedValueOnce({ success: true as const });
    },

    rejects: ({ error }: { error: Error }) => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
