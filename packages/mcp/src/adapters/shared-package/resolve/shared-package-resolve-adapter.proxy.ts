import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const sharedPackageResolveAdapterProxy = (): {
  packageRootExists: () => void;
  packageRootDoesNotExist: () => void;
  srcExists: () => void;
  srcDoesNotExist: () => void;
} => {
  const handle = registerMock({ fn: existsSync });

  // No address: the checked path comes from a real require.resolve() call, never mocked, so its
  // exact value is environment-dependent and unknowable at staging time.
  // Default: package root exists
  handle.calledWith([]).returns(true);

  return {
    packageRootExists: (): void => {
      handle.calledWith([]).returns(true);
    },

    packageRootDoesNotExist: (): void => {
      handle.calledWith([]).returns(false);
    },

    // Backwards-compatible aliases
    srcExists: (): void => {
      handle.calledWith([]).returns(true);
    },

    srcDoesNotExist: (): void => {
      handle.calledWith([]).returns(false);
    },
  };
};
