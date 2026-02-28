jest.mock('fs/promises');

import { writeFile } from 'fs/promises';

export const fsWriteFileAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
  getAllWrittenFiles: () => ReadonlyArray<{ path: unknown; content: unknown }>;
} => {
  const mock = jest.mocked(writeFile);

  mock.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce(undefined);
    },

    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },

    getWrittenContent: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[1];
    },

    getWrittenPath: (): unknown => {
      const { calls } = mock.mock;
      const lastCall = calls[calls.length - 1];
      if (!lastCall) return undefined;
      return lastCall[0];
    },

    getAllWrittenFiles: (): ReadonlyArray<{ path: unknown; content: unknown }> =>
      mock.mock.calls.map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
