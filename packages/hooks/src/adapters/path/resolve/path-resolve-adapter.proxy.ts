jest.mock('path');

import { resolve } from 'path';

export const pathResolveAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  const mock = jest.mocked(resolve);

  // Default: return the last path segment
  mock.mockImplementation((...paths) => paths[paths.length - 1] ?? '');

  return {
    returns: ({ path }: { path: string }) => {
      mock.mockReturnValueOnce(path);
    },
  };
};
