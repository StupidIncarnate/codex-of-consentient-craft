import { existsSync } from 'fs';

// Declare jest.mock() in proxy (auto-hoisted by Jest)
jest.mock('fs');

export const fsExistsSyncAdapterProxy = (): {
  returns: ({ result }: { result: boolean }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = jest.mocked(existsSync);

  // Default mock behavior - return false
  mock.mockReturnValue(false);

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: boolean }) => {
      mock.mockReturnValueOnce(result);
    },
  };
};
