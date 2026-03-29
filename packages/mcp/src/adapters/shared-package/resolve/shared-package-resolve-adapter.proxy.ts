import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const sharedPackageResolveAdapterProxy = (): {
  packageRootExists: () => void;
  packageRootDoesNotExist: () => void;
  srcExists: () => void;
  srcDoesNotExist: () => void;
} => {
  const handle = registerMock({ fn: existsSync });

  // Default: package root exists
  handle.mockReturnValue(true);

  return {
    packageRootExists: (): void => {
      handle.mockReturnValue(true);
    },

    packageRootDoesNotExist: (): void => {
      handle.mockReturnValue(false);
    },

    // Backwards-compatible aliases
    srcExists: (): void => {
      handle.mockReturnValue(true);
    },

    srcDoesNotExist: (): void => {
      handle.mockReturnValue(false);
    },
  };
};
