import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ exists }: { exists: boolean }) => void;
} => {
  const mock = registerMock({ fn: existsSync });

  mock.mockReturnValue(false);

  return {
    returns: ({ exists }: { exists: boolean }) => {
      mock.mockReturnValueOnce(exists);
    },
  };
};
