import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const handle = registerMock({ fn: writeFile });

  handle.mockResolvedValue({ success: true as const });

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce({ success: true as const });
    },

    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },

    getWrittenContent: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },

    getWrittenPath: (): unknown => {
      const { calls } = handle.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },

    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      handle.mock.calls.map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
