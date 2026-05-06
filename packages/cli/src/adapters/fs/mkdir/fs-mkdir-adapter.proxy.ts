import { mkdir } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsMkdirAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  getMkdirCalls: () => readonly { path: unknown; options: unknown }[];
} => {
  const handle = registerMock({ fn: mkdir });

  handle.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getMkdirCalls: (): readonly { path: unknown; options: unknown }[] =>
      handle.mock.calls.map((call) => ({ path: call[0], options: call[1] })),
  };
};
