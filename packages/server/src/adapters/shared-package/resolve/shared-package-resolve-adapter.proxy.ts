import { existsSync } from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

export const sharedPackageResolveAdapterProxy = (): {
  srcExists: () => void;
  srcDoesNotExist: () => void;
} => {
  const mockExistsSync = jest.mocked(existsSync);

  // Default: src directory exists
  mockExistsSync.mockReturnValue(true);

  return {
    srcExists: () => {
      mockExistsSync.mockReturnValue(true);
    },

    srcDoesNotExist: () => {
      mockExistsSync.mockReturnValue(false);
    },
  };
};
