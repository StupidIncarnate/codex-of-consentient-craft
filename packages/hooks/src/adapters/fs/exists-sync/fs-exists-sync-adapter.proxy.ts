jest.mock('fs');

import { existsSync } from 'fs';

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ exists }: { exists: boolean }) => void;
} => {
  const mock = jest.mocked(existsSync);

  mock.mockReturnValue(false);

  return {
    returns: ({ exists }: { exists: boolean }) => {
      mock.mockReturnValueOnce(exists);
    },
  };
};
