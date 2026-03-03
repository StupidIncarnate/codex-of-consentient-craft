jest.mock('fs/promises');

import { appendFile } from 'fs/promises';

export const fsAppendFileAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getAppendedContent: () => unknown;
  getAppendedPath: () => unknown;
  getAllAppendedFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const mock = jest.mocked(appendFile);

  mock.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce(undefined);
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
