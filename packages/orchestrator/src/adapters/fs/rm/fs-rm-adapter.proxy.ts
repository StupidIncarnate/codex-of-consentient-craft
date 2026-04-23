import { rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsRmAdapterProxy = (): {
  succeeds: () => void;
  throws: (params: { error: Error }) => void;
  getCallArgs: () => readonly unknown[][];
} => {
  const mock = registerMock({ fn: rm });

  mock.mockResolvedValue(undefined);

  return {
    succeeds: (): void => {
      mock.mockResolvedValueOnce(undefined);
    },
    throws: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
    getCallArgs: (): readonly unknown[][] => mock.mock.calls,
  };
};
