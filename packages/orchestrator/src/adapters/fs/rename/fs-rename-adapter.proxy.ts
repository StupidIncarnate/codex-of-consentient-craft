import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const fsRenameAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getFromPath: () => unknown;
  getToPath: () => unknown;
  getAllRenames: () => readonly { from: unknown; to: unknown }[];
} => {
  const mock: MockHandle = registerMock({ fn: rename });

  mock.mockResolvedValue({ success: true as const });

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce({ success: true as const });
    },

    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },

    getFromPath: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },

    getToPath: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },

    getAllRenames: (): readonly { from: unknown; to: unknown }[] =>
      mock.mock.calls.map((call) => ({
        from: call[0],
        to: call[1],
      })),
  };
};
