import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const webBundleDistPathAdapterProxy = (): {
  bundleExists: () => void;
  bundleMissing: () => void;
} => {
  const handle = registerMock({ fn: existsSync });

  // Default: the bundle's dist/ directory exists
  handle.calledWith([]).returns(true);

  return {
    bundleExists: (): void => {
      handle.calledWith([]).returns(true);
    },
    bundleMissing: (): void => {
      handle.calledWith([]).returns(false);
    },
  };
};
