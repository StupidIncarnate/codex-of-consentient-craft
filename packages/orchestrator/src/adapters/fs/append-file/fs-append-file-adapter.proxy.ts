import { appendFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const fsAppendFileAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getAppendedContent: () => unknown;
  getAppendedPath: () => unknown;
  getAllAppendedFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const mock: MockHandle = registerMock({ fn: appendFile });

  mock.mockResolvedValue({ success: true as const });

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce({ success: true as const });
    },

    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },

    getAppendedContent: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },

    getAppendedPath: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },

    getAllAppendedFiles: (): readonly { path: unknown; content: unknown }[] =>
      mock.mock.calls.map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
