import { existsSync, type PathLike } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ result }: { result: boolean }) => void;
  implementation: ({ fn }: { fn: (filePath: PathLike) => boolean }) => void;
} => {
  const handle = registerMock({ fn: existsSync });

  // Default mock behavior - return false
  handle.mockReturnValue(false);

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: boolean }) => {
      handle.mockReturnValueOnce(result);
    },
    implementation: ({ fn }: { fn: (filePath: PathLike) => boolean }): void => {
      handle.mockImplementation(fn as never);
    },
  };
};
