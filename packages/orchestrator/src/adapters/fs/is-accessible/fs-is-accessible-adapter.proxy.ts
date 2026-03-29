import { access } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const fsIsAccessibleAdapterProxy = (): {
  resolves: () => void;
  rejects: (params: { error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: access });

  mock.mockResolvedValue(undefined);

  return {
    resolves: (): void => {
      mock.mockResolvedValueOnce(undefined);
    },

    rejects: ({ error }: { error: Error }): void => {
      mock.mockRejectedValueOnce(error);
    },
  };
};
