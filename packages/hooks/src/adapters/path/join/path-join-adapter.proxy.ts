import { join } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const pathJoinAdapterProxy = (): {
  returns: ({ result }: { result: FilePath }) => void;
} => {
  // Mock the npm package, not the adapter
  const mock = registerMock({ fn: join });

  // Default mock behavior - return joined path
  mock.mockImplementation((...segments) => segments.join('/'));

  return {
    // Semantic method for setting return value
    returns: ({ result }: { result: FilePath }) => {
      mock.mockReturnValueOnce(result);
    },
  };
};
