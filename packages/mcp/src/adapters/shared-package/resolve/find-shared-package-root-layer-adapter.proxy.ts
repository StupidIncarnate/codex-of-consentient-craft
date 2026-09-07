import { join } from 'path';
import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const findSharedPackageRootLayerAdapterProxy = (): {
  packageRootExists: () => void;
  packageRootDoesNotExist: () => void;
  setupPackageJsonAt: ({ dirPath, exists }: { dirPath: string; exists: boolean }) => void;
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

    // Path-specific override for a fake directory chain — more specific than the [] catch-all
    // above, so it wins regardless of registration order. Used to exercise a multi-level walk.
    setupPackageJsonAt: ({ dirPath, exists }: { dirPath: string; exists: boolean }): void => {
      handle.calledWith([join(dirPath, 'package.json')]).returns(exists);
    },
  };
};
