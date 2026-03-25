import { existsSync } from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

export const sharedPackageResolveAdapterProxy = (): {
  packageRootExists: () => void;
  packageRootDoesNotExist: () => void;
  srcExists: () => void;
  srcDoesNotExist: () => void;
} => {
  const mockExistsSync = jest.mocked(existsSync);

  // Default: package root exists
  mockExistsSync.mockReturnValue(true);

  return {
    packageRootExists: () => {
      mockExistsSync.mockReturnValue(true);
    },

    packageRootDoesNotExist: () => {
      mockExistsSync.mockReturnValue(false);
    },

    // Backwards-compatible aliases
    srcExists: () => {
      mockExistsSync.mockReturnValue(true);
    },

    srcDoesNotExist: () => {
      mockExistsSync.mockReturnValue(false);
    },
  };
};
