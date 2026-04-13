import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsAccessAdapterProxy = (): {
  resolves: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const handle = registerMock({ fn: access });

  handle.mockResolvedValue({ success: true as const });

  return {
    resolves: () => {
      handle.mockResolvedValueOnce({ success: true as const });
    },

    rejects: ({ error }: { error: Error }) => {
      handle.mockRejectedValueOnce(error);
    },
  };
};
