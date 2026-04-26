import { minimatch } from 'minimatch';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const minimatchMatchAdapterProxy = (): {
  returns: ({ result }: { result: boolean }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: minimatch });

  // Default mock behavior - return false
  mock.mockReturnValue(false);

  return {
    returns: ({ result }: { result: boolean }) => {
      mock.mockReturnValueOnce(result);
    },
  };
};
