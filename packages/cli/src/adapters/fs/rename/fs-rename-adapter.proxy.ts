import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsRenameAdapterProxy = (): {
  succeeds: () => void;
  throws: ({ error }: { error: Error }) => void;
  getRenameCalls: () => readonly { from: unknown; to: unknown }[];
} => {
  const handle = registerMock({ fn: rename });

  handle.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      handle.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      handle.mockRejectedValueOnce(error);
    },
    getRenameCalls: (): readonly { from: unknown; to: unknown }[] =>
      handle.mock.calls.map((call) => ({ from: call[0], to: call[1] })),
  };
};
