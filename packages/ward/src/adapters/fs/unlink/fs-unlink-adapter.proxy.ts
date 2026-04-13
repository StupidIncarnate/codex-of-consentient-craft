import { unlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsUnlinkAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
} => {
  const mock = registerMock({ fn: unlink });

  mock.mockResolvedValue({ success: true as const });

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce({ success: true as const });
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
