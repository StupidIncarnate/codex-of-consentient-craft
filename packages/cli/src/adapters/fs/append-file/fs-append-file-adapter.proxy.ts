import { appendFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsAppendFileAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  getAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const handle = registerMock({ fn: appendFile });

  handle.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getAppendCalls: (): readonly { path: unknown; content: unknown }[] =>
      handle.mock.calls.map((call) => ({ path: call[0], content: call[1] })),
  };
};
