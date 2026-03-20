import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ result }: { result: boolean }) => void;
} => {
  const handle = registerMock({ fn: existsSync });

  // Default mock behavior - return false
  handle.mockReturnValue(false);

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: boolean }) => {
      handle.mockReturnValueOnce(result);
    },
  };
};
