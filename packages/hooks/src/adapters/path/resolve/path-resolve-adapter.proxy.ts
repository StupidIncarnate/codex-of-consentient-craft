import { resolve } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const pathResolveAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
  getHandle: () => MockHandle;
} => {
  const mock = registerMock({ fn: resolve });

  // Default: return the last path segment
  mock.mockImplementation((...paths) => {
    const segments = paths as unknown[];
    return (segments[segments.length - 1] as undefined | typeof resolve) ?? '';
  });

  return {
    returns: ({ path }: { path: string }) => {
      mock.mockReturnValueOnce(path);
    },
    getHandle: () => mock,
  };
};
